// share/components/Measurements/index.ts
import React, { FC, useCallback, useEffect, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Box } from "@mui/material";

import { GraphicId } from "share/stores/mapStore/types";
import { MeasurementType } from "share/stores/measurementStore/types";
import CloseIconButton from "share/components/CloseIconButton";
import { useRootStore } from "share/hooks";
import { Id } from "share/types";

import MeasurementsItemsList from "./components/MeasurementsItemsList";
import MeasurementsSectionsList from "./components/MeasurementsSectionsList";

const Measurements: FC<Id> = ({ id }) => {
  const { jobStore, mapStore } = useRootStore();
  const { job } = jobStore;
  const { removeGraphicsById } = mapStore;

  const [measurementType, setMeasurementType] = useState<MeasurementType | null>(null);

  const zoomToCurrentJob = useCallback(async () => {
    if (!job?.id) {
      return;
    }

    const currentJobGraphic = mapStore.utils.getGraphicByItemId(job.id);
    if (currentJobGraphic) {
      await mapStore.utils.zoomToGeometry(currentJobGraphic.geometry);
    }
  }, [job?.id, mapStore]);

  const handleBack = useCallback(async () => {
    setMeasurementType(null);
    removeGraphicsById(GraphicId.measurement);

    if (measurementType) {
      await zoomToCurrentJob();
    }
  }, [measurementType, removeGraphicsById, zoomToCurrentJob]);

  useEffect(() => {
    const close = () => {
      // async func
      handleBack();
    };

    return close;
    // it should be called only after unmounting the component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      {measurementType ? (
        <>
          <CloseIconButton onClick={handleBack} icon={<ArrowBackRoundedIcon />} />
          <MeasurementsItemsList selectedMeasurementType={measurementType} id={id} />
        </>
      ) : (
        <MeasurementsSectionsList setMeasurementType={setMeasurementType} />
      )}
    </Box>
  );
};

export default Measurements;
  
  
 
// share/components/Measurements/components/MeasurementsItemsList.tsx
import React, { FC, useEffect, useMemo, useState } from "react";
import { Stack, SxProps, Theme } from "@mui/material";
import { observer } from "mobx-react-lite";

import { MeasurementType } from "share/stores/measurementStore";
import { useRootStore, useFetchWithLoading } from "share/hooks";
import Loader from "share/components/Loader";
import { NoDataMessage } from "share/components/NoDataMessage";
import { thumbStyles } from "share/constants/styles";
import { Id } from "share/types";

import MeasurementItem from "./MeasurementItem";

interface MeasurementsItemsListProps {
  selectedMeasurementType: MeasurementType;
}

const MeasurementsItemsList: FC<Id & MeasurementsItemsListProps> = ({ id, selectedMeasurementType }) => {
  const { measurementStore } = rootStore;
  const { measurements, getAllMeasurements, _setMeasurements } = measurementStore;

  const measurementsByType = useMemo(
    () => measurements?.filter(({ type }) => type === selectedMeasurementType),
    [measurements, selectedMeasurementType]
  );

  const [fetchMeasurementsWithLoading, isLoading, isLoaded] = useFetchWithLoading(() => getAllMeasurements(id));
  useEffect(() => {
    fetchMeasurementsWithLoading();
    return _setMeasurements(null);
  }, [fetchMeasurementsWithLoading, _setMeasurements, id]);

  if (!isLoaded || isLoading) {
    return <Loader />;
  }

  const isMeasurementsWithTypeExists = !!measurementsByType?.length;
  
  return (
    <Stack spacing={1} sx={listContainerStyles}>
      {isMeasurementsWithTypeExists &&
        measurementsByType.map(m => (
          <MeasurementItem key={m.id} measurementType={selectedMeasurementType} measurement={m} />
        ))}
      {isMeasurementsWithTypeExists && <NoDataMessage />}
    </Stack>
  );
};

const listContainerStyles: SxProps<Theme> = {
  maxHeight: "50vh",
  ...thumbStyles,
};

export default observer(MeasurementsItemsList);

  
