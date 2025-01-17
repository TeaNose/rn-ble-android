import {useState} from 'react';
import {Alert, PermissionsAndroid, ToastAndroid} from 'react-native';
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from 'react-native-ble-plx';
import DeviceInfo from 'react-native-device-info';
import {PERMISSIONS} from 'react-native-permissions';
import {Buffer} from 'buffer';

type PermissionCallback = (result: boolean) => void;

const bleManager = new BleManager();

const SERVICE_ID = 'b7ef1193-dc2e-4362-93d3-df429eb3ad10';
const CMD_CHARAC_ID = '00ce7a72-ec08-473d-943e-81ec27fdc600';
const DATA_CHARAC_ID = '00ce7a72-ec08-473d-943e-81ec27fdc5f2';

// const SERVICE_ID = '0000fe40-cc7a-482a-984a-7f2ed5b3e512';
// const DATA_CHARAC_ID = '0000fe42-cc7a-482a-984a-7f2ed5b3e512';

// const CONNECTED_DEVICE_DUMMY = {
//   id: 1,
//   name: 'Test Device',
// };

interface BluetoothLowEnergyApi {
  requestPermissions(callback: PermissionCallback): Promise<void>;
  scanForDevices(): void;
  allDevices: Device[];
  isScanningDevice: boolean;
  connectToDevice: (deviceId: Device) => Promise<void>;
  connectedDevice: Device | null;
  monitoredData: number;
  setMonitoredData: (value: number) => void;
}

export default function useBle(): BluetoothLowEnergyApi {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [isScanningDevice, setIsScanningDevice] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [monitoredData, setMonitoredData] = useState(1);
  const [writeCharacteristic, setWriteCharacteristic] = useState(null);
  const [readCharacteristic, setReadCharacteristic] = useState(null);

  const requestPermissions = async (callback: PermissionCallback) => {
    const apiLevel = await DeviceInfo.getApiLevel();
    console.log('apiLevel: ', apiLevel);
    if (apiLevel < 31) {
      const grantedStatus = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Bluetooth Low Energy Needs Location Permission',
          buttonNegative: 'Cancel',
          buttonPositive: 'Ok',
          buttonNeutral: 'Maybe Later',
        },
      );
      callback(grantedStatus === PermissionsAndroid.RESULTS.GRANTED);
    } else {
      const result = await PermissionsAndroid.requestMultiple([
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ]);

      const isAllPermissionsGranted =
        result['android.permission.BLUETOOTH_SCAN'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.BLUETOOTH_CONNECT'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.ACCESS_FINE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED;

      callback(isAllPermissionsGranted);
    }
  };

  const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex(device => device?.id === nextDevice?.id) > -1;

  const scanForDevices = () => {
    setIsScanningDevice(true);
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setIsScanningDevice(false);
        Alert.alert('Error Scanning Devices', String(error?.message));
      }
      if (device && device?.name?.includes('DT_ZB_20703754')) {
        setAllDevices(prevState => {
          if (!isDuplicateDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
        setIsScanningDevice(false);
        bleManager.stopDeviceScan();
      }
    });
  };

  const connectToDevice = async (device: Device) => {
    try {
      const deviceConnection = await bleManager.connectToDevice(device?.id);
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();

      const characteristic = await deviceConnection.characteristicsForService(
        SERVICE_ID,
      );
      characteristic.forEach(characteristicitem => {
        if (characteristicitem.uuid === CMD_CHARAC_ID) {
          console.log(
            'writeCharacteristic: ',
            JSON.stringify(characteristicitem),
          );
          setWriteCharacteristic(characteristicitem);
        }
        if (characteristicitem.uuid === DATA_CHARAC_ID) {
          console.log('readCharacteristic: ', JSON.stringify(characteristicitem));
          setReadCharacteristic(characteristicitem);
        }
      });
      bleManager.stopDeviceScan();
      startStreamingData(device);
    } catch (error) {
      Alert.alert('Error Connecting Device', JSON.stringify(error));
    }
  };

  const onDetectData = (
    error: BleError | null,
    characteristic: Characteristic | null,
  ) => {
    if (error) {
      Alert.alert('Error Detecting Data', JSON.stringify(error));
      return;
    } else if (!characteristic) {
      ToastAndroid.show('No Characteristic Found', ToastAndroid.SHORT);
      return;
    }
    ToastAndroid.show('Success Detect Vibration', ToastAndroid.SHORT);
    setMonitoredData((prevState: number) => prevState + 1);
  };

  const startStreamingData = async (device: Device) => {
    if (device) {
      device.monitorCharacteristicForService(
        SERVICE_ID,
        DATA_CHARAC_ID,
        onDetectData,
      );
    } else {
      ToastAndroid.show('No Device Connected', ToastAndroid.SHORT);
    }
  };

  const intToBytes = (value: number) => {
    return [
      value & 0xff,
      (value >> 8) & 0xff,
      (value >> 16) & 0xff,
      (value >> 24) & 0xff,
    ];
  };

  const sendCommand = async (cmd: number, data: number[]) => {
    if (!writeCharacteristic) {
      Alert.alert('Write characteristic not found');
      return;
    }

    const checksum = (data.reduce((sum, val) => sum + val, 0) + cmd) % 256;
    const command = [0xaa, cmd, data.length + 4, ...data, checksum];

    const encodedCommand = Buffer.from(command).toString('base64');
    console.log('encodedCommand: ', encodedCommand);
    await writeCharacteristic.writeWithResponse(encodedCommand);
  };

  const collectVibrationData = async () => {
    const vibrationCommand = 0x01;
    const data = intToBytes(3125);
    console.log('data: ', data);
    await sendCommand(vibrationCommand, data);
  };

  return {
    requestPermissions,
    scanForDevices,
    allDevices,
    isScanningDevice,
    connectToDevice,
    connectedDevice,
    monitoredData,
    setMonitoredData,
    collectVibrationData,
  };
}
