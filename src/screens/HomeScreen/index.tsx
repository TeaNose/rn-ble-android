/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
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
    disconnectDevice,
    isBack,
    setIsBack,
    collectValue,
    resumeCollectData,
    pauseCollectTempData,
    isPaused,
    formattedChartData,
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
        <View>
          <Text style={styles.title}>Available Device</Text>
          <Button
            title={isBack ? 'Untest' : 'TEst'}
            onPress={() => setIsBack(!isBack)}
          />
        </View>
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
              <Button
                title={
                  connectedDevice?.id === device.id ? 'Disconnected' : 'Connect'
                }
                onPress={() =>
                  connectedDevice?.id === device.id
                    ? disconnectDevice(device.id)
                    : connectToDevice(device)
                }
              />
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

            <TouchableOpacity onPress={() => connectToDevice(connectedDevice)}>
              <Text>Hello world</Text>
            </TouchableOpacity>
          </View>
        )}

        <View>
          <Text style={{paddingVertical: 10}}>Realtime Value:</Text>
          <Text>{collectValue}</Text>
        </View>

        {receivedData.length !== 0 && (
          <>
            <LineChart
              width={WIDTH}
              height={300}
              withInnerLines={false}
              segments={0}
              data={formattedChartData}
              chartConfig={{
                backgroundColor: '#e26a00',
                backgroundGradientFrom: '#fb8c00',
                backgroundGradientTo: '#ffa726',
                decimalPlaces: 1,
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

                // Format y-axis labels to show temperature in °C
                formatYLabel: value => `${value}°C`,
              }}
              bezier
              yAxisLabel=""
              yAxisSuffix="°C"
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                position: 'absolute',
                bottom: -10,
                right: 0,
                transform: [{translateX: -40}],
              }}>
              Seconds
            </Text>
          </>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Scan Devices"
          onPress={onScanDevices}
          disabled={!isDisableStopBtn}
        />

        {!isDisableStopBtn && (
          <View style={{flexDirection: 'row', marginTop: 10}}>
            <View style={{width: '100%'}}>
              <Button
                title={isPaused ? 'Resume' : 'Pause'}
                onPress={isPaused ? resumeCollectData : pauseCollectTempData}
                color={isPaused ? 'green' : 'red'}
              />
            </View>
            {/* <View style={{width: '48%'}}>
              <Button
                title="Pause"
                onPress={pauseCollectTempData}
                color={'red'}
              />
            </View> */}
          </View>
        )}

        <View style={{height: 10}} />

        {/* {!!connectedDevice && ( */}
        <>
          <Button
            title="Collect Vibration Data"
            onPress={collectVibrationData}
            disabled={!isDisableStopBtn}
            color={'blue'}
          />
          <View style={styles.containerBtnStopCollecting}>
            <Button
              title="Stop Collect Data"
              onPress={stopCollectTmpData}
              disabled={isDisableStopBtn || isPaused}
              color={'red'}
            />
          </View>
        </>
        {/* )} */}
      </View>
    </>
  );
};

export default HomeScreen;
