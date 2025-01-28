import React from 'react';
import {View, Text, Button, ActivityIndicator} from 'react-native';

import styles from './styles';
import useBle from '../../hooks/useBle';
import {Device} from 'react-native-ble-plx';

const HomeScreen = () => {
  const {
    requestPermissions,
    scanForDevices,
    stopCollectTmpData,
    allDevices,
    isScanningDevice,
    connectToDevice,
    connectedDevice,
    monitoredData,
    collectVibrationData,
    isDisableStopBtn,
  } = useBle();

  const onScanDevices = async () => {
    requestPermissions((isGranted: boolean) => {
      if (isGranted) {
        scanForDevices();
      }
    });
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Available Device</Text>
        {isScanningDevice && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size={'small'} />
          </View>
        )}
        {allDevices?.map((device: Device) => (
          <View style={styles.deviceItemContainer}>
            <View style={styles.deviceItem}>
              <Text>{device?.name}</Text>
            </View>
            <View style={styles.connectButtonContainer}>
              <Button title="Connect" onPress={() => connectToDevice(device)} />
            </View>
          </View>
        ))}
        {!!connectedDevice && (
          <View style={styles.connectedDeviceContainer}>
            <Text style={styles.title}>Connected Device</Text>
            <Text
              style={
                styles.data
              }>{`Device Name: ${connectedDevice?.name}`}</Text>
            <Text
              style={styles.data}>{`Device ID: ${connectedDevice?.id}`}</Text>
            <Text>{`Data: ${monitoredData}`}</Text>
          </View>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Scan Devices" onPress={onScanDevices} />
        <View style={{height: 10}} />
        <Button
          title="Collect Vibration Data"
          onPress={collectVibrationData}
          disabled={!connectedDevice}
        />
        <View style={styles.containerBtnStopCollecting}>
          <Button
            title="Stop Collect Data"
            onPress={stopCollectTmpData}
            disabled={isDisableStopBtn}
            color={'red'}
          />
        </View>
      </View>
    </>
  );
};

export default HomeScreen;
