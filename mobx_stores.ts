// shared/stores/mapStore/lib/_utils.ts
// I set up import sorting myself
import Collection from "@arcgis/core/core/Collection";
import Geometry from "@arcgis/core/geometry/Geometry";
import Graphic from "@arcgis/core/Graphic";
import { makeAutoObservable } from "mobx";

import { selectedStylesSymbols } from "../constants";
import { MapStore } from "../index";
import { Attributes, GraphicId, MapItem, Position, SymbolStyleType } from "../types";

// i created this class to remove some of the auxiliary logic from the MapStore
export class _Utils {
  constructor(private readonly _mapStore: MapStore) {
    makeAutoObservable(this);
  }

  public readonly addToView = (graphic: Graphic | Collection<Graphic>): void => {
    if (this.checkIsCollection(graphic)) {
      this._mapStore._view?.graphics.addMany(graphic as Collection<Graphic>); // checking is above
      return;
    }

    this._mapStore._view?.graphics.add(graphic as Graphic); // checking is above
  };

  public readonly addToGraphicsLayer = (graphic: Graphic | Collection<Graphic>): void => {
    if (this.checkIsCollection(graphic)) {
      this._mapStore._graphicsLayer.graphics.addMany(graphic as Collection<Graphic>); // checking is above
      return;
    }

    this._mapStore._graphicsLayer?.graphics.add(graphic as Graphic); // checking is above
  };

  public readonly getGraphicsByGraphicType = (typeId: GraphicId): Collection<Graphic> | null => {
    return this._mapStore._view?.graphics.filter(({ attributes }) => attributes?.id === typeId) ?? null;
  };

  public readonly getGraphicByItemId = (id: string): Graphic | null => {
    const graphic =
      this._mapStore._view?.graphics?.find(({ attributes }) => this.handleCheckItemId(attributes, id)) ??
      this._mapStore._graphicsLayer.graphics.find(({ attributes }) => this.handleCheckItemId(attributes, id)); // we have 2 layers when we can get a graphic

    if (!graphic) {
      console.warn(`Graphic ${id} not found`);
      return null
    }
    
    return graphic;
  };

  public readonly removeGraphicsByGraphicType = (graphicType: GraphicId): void => {
    const graphics = this.getGraphicsByGraphicType(graphicType);

    if (!graphics) {
      return;
    }

    this._mapStore._view?.graphics.removeMany(graphics);
  };

  public readonly removeGraphicByItemId = (itemId: string): void => {
    const graphic = this.getGraphicByItemId(itemId);

    if (!graphic) {
      return;
    }

    this._mapStore._view?.graphics.remove(graphic);
  };

  public readonly setSymbolStylesForAllGraphics = (symbolStyleType: SymbolStyleType, graphicType?: GraphicId): void => {
    const graphics = graphicType ? this.getGraphicsByGraphicType(graphicType) : this._mapStore._view?.graphics;
    graphics?.forEach(g => this.setSymbolStyle(g, symbolStyleType));
  };

  public readonly setSymbolStyle = (graphic: Graphic, symbolStyleType: SymbolStyleType): void => {
    const symbolType = graphic.symbol.type;
    const graphicTypeSymbols = selectedStylesSymbols[symbolType];

    if (!graphicTypeSymbols) {
      console.warn(`Graphic type symbols do not setted for this symbol type: ${symbolType}`);
      return;
    }

    graphic.symbol = graphicTypeSymbols[symbolStyleType];
  };

  public readonly clearViewGraphics = (): void => {
    this._mapStore._view?.graphics.removeAll();
  };

  public readonly clearGraphicLayer = (): void => {
    if (this._mapStore.isAllMapInit) {
      this._mapStore._graphicsLayer.removeAll();
    } else {
      console.error("The card has not been initialized yet");
    }
  };

  public readonly resetMapInit = (): void => {
    this._mapStore.setIsMapAndGraphicLayerInit(false);
    this._mapStore.setIsSketchInit(false);
    this._mapStore.setIsViewInit(false);
  };

  public readonly zoomToGeometry = async (geometry: Geometry): Promise<void> => {
    await this._mapStore._view?.goTo(geometry.extent);
  };

  public readonly setCoordinates = async (coordinates: Position, zoom: number): Promise<void> => {
    if (this._mapStore.isViewInit) {
      await this._mapStore._view?.goTo({
        center: coordinates,
        zoom,
      });
    }
  };

  public readonly getGraphicFromMap = (map: string): Graphic => {
    const parsedMap = JSON.parse(map); // graphic or { graphic, coordinates, zoom? }
    return Graphic.fromJSON(parsedMap.graphic ?? parsedMap);
  };

  public readonly filterExistingMap = <T extends MapItem>(mapItems: T[]): T[] => {
    return mapItems.filter(mi => !!Object.keys(JSON.parse(mi.map)).length);
  };

  private readonly handleCheckItemId = (attributes: Attributes, itemId: string): boolean => {
    return attributes?.itemId === itemId;
  };

  private readonly checkIsCollection = (graphic: Graphic | Collection<Graphic>): boolean =>
    graphic instanceof Collection;
}
    
// shared/stores/mapStore/index.ts
export class MapStore {
  // helpers
  utils = new _Utils(this);
  // ...
    
  constructor(rootStore: RootStore) {
    makeAutoObservable(this);
  }
}

// shared/stores/rootStore.ts
import { makeAutoObservable } from "mobx";
import { MapStore } from "./mapStore";

class RootStore {
  public readonly mapStore: MapStore;
  // ...other stores

  constructor() {
    makeAutoObservable(this);
    
    this.mapStore = new MapStore(this);
    // ...othser stores
  }
}

export const rootStore = new RootStore();

export default RootStore;
    
// public api
// shared/stores/index.ts
import {default as rootStore} from "./rootStore.ts
