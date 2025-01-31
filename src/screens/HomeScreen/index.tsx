/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, Text, Button, ActivityIndicator, Dimensions} from 'react-native';
import {LineChart} from 'react-native-chart-kit';

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
    receivedData,
  } = useBle();

  const WIDTH = Dimensions.get('screen').width - 35;

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

        {receivedData.length !== 0 && (
          <LineChart
            width={WIDTH}
            height={300}
            withInnerLines={false}
            data={{
              labels: [],
              datasets: [
                {data: receivedData, color: () => 'blue', strokeWidth: 2},
              ],
            }}
            // yAxisLabel="$"
            chartConfig={{
              backgroundColor: '#e26a00',
              backgroundGradientFrom: '#fb8c00',
              backgroundGradientTo: '#ffa726',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
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
