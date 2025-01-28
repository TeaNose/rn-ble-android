/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-bitwise */
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

export default function useBle() {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [isScanningDevice, setIsScanningDevice] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [monitoredData, setMonitoredData] = useState(0);
  const [writeCharacteristic, setWriteCharacteristic] = useState<any>(null);
  const [readCharacteristic, setReadCharacteristic] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDisableStopBtn, setIsDisableStopBtn] = useState(true);

  // let percentage = 0;
  // let waveDataT = {};
  // let resciveData = [];

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
      characteristic.forEach((characteristicitem: any) => {
        if (characteristicitem.uuid === CMD_CHARAC_ID) {
          console.log(
            'writeCharacteristic: ',
            JSON.stringify(characteristicitem),
          );
          setWriteCharacteristic(characteristicitem);
        }
        if (characteristicitem.uuid === DATA_CHARAC_ID) {
          console.log(
            'readCharacteristic: ',
            JSON.stringify(characteristicitem),
          );
          setReadCharacteristic(characteristicitem);
        }
      });
      bleManager.stopDeviceScan();

      await bleManager.requestMTUForDevice(device?.id, 512); //!!!!!!!!!!!!! tambah ini

      console.log('Habis write nih boy');
      startStreamingData(device);
    } catch (error) {
      Alert.alert('Error Connecting Device', JSON.stringify(error));
    }
  };

  const onDetectData = (
    error: BleError | null,
    characteristic: Characteristic | any,
  ) => {
    if (error) {
      Alert.alert('Error Detecting Data', JSON.stringify(error));
      return;
    } else if (!characteristic) {
      ToastAndroid.show('No Characteristic Found', ToastAndroid.SHORT);
      return;
    }
    // ToastAndroid.show('Success Detect Vibration', ToastAndroid.SHORT);
    setMonitoredData((prevState: number) => prevState + 1);

    const vibrationData = Buffer.from(characteristic.value, 'base64');
    // console.log('Vibration data received:', vibrationData);

    handleData(vibrationData);
  };

  const startStreamingData = async (device: Device) => {
    if (device && !isSubscribed) {
      setIsSubscribed(true);
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

  // / Helper function to convert a byte array to an integer
  function bytesToInt(bytes: any) {
    return bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
  }

  // Helper function to convert a byte array to a float
  function bytesToFloat(bytes: any) {
    // console.log(bytes)
    const intValue = bytesToInt(bytes);

    const buffer = Buffer.alloc(4);
    buffer.writeInt32LE(intValue, 0);
    return buffer.readFloatLE(0);
  }

  const sendData = (cmd: number, data: number[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      if (!writeCharacteristic) {
        reject(new Error('No write characteristic available.'));
        return;
      }
      console.log('Begin writing data');

      const nowSendData = [0xaa, cmd, data.length + 4, ...data];
      let cs = 0;

      nowSendData.forEach(p => {
        cs = (cs + p) % 256;
      });

      cs = 256 - cs;

      const finalData = [...nowSendData, cs];
      // console.log('finalData: ', JSON.stringify(finalData));
      const buffer = Buffer.from(finalData).toString('base64');
      // console.log('buffer: ', buffer);

      writeCharacteristic
        ?.writeWithResponse(buffer)
        .then(() => {
          console.log('Finished writing data');
          resolve();
        })
        .catch((err: any) =>
          reject(new Error('Error writing data to characteristic: ' + err)),
        );
    });

    // const mtuSize = 20; // Adjust based on your device's MTU
    // const chunkedData = [];
    // for (let i = 0; i < finalData.length; i += mtuSize) {
    //   chunkedData.push(finalData.slice(i, i + mtuSize));
    // }

    // for (const chunk of chunkedData) {
    //   const buffer = Buffer.from(chunk);
    //   try {
    //     await writeCharacteristic.writeWithResponse(
    //       buffer.toString('base64'),
    //     );
    //     console.log('Chunk written successfully:', chunk);
    //   } catch (err) {
    //     console.error('Error writing chunk:', chunk, err);
    //     break;
    //   }
    // }
    // });
  };

  const collectData = (
    val: number,
    samp: number,
    nowLength: number,
    nowFreq: number,
  ) => {
    console.log('Begin collecting data');
    const data: number[] = [];
    const now = new Date();
    const formatted = now.toISOString().slice(0, 19).replace(/[-T:]/g, ''); // YYYYMMDDHHMMSS
    // const formatted = '20250124090206';

    // console.log(now);

    const startCollect = {
      systemTime: {
        Y: formatted.substring(0, 2),
        y: formatted.substring(2, 4),
        M: formatted.substring(4, 6),
        d: formatted.substring(6, 8),
        H: formatted.substring(8, 10),
        m: formatted.substring(10, 12),
        s: formatted.substring(12),
      },
      isIntvSample: 0,
      mdefLen: {
        x: nowLength,
        z: nowLength,
        y: nowLength,
      },
      mdefFreq: {
        x: nowFreq,
        z: nowFreq,
        y: nowFreq,
      },
      meaIntv: 1,
      lwLength: 128,
      lwFreq: 1000,
      lwIntv: 1,
      isSampleInd: val,
      indLength: 1,
      indFreq: 500,
      indIntv: 1,
      sampleDir: samp,
    };

    data.push(parseInt(startCollect.systemTime.Y, 10));
    data.push(parseInt(startCollect.systemTime.y, 10));
    data.push(parseInt(startCollect.systemTime.M, 10));
    data.push(parseInt(startCollect.systemTime.d, 10));
    data.push(parseInt(startCollect.systemTime.H, 10));
    data.push(parseInt(startCollect.systemTime.m, 10));
    data.push(parseInt(startCollect.systemTime.s, 10));
    data.push(startCollect.isIntvSample);
    // console.log('1: ', JSON.stringify(data));

    // Append length data for each axis
    data.push(...intToBytes(startCollect.mdefLen.x));
    data.push(...intToBytes(startCollect.mdefLen.z));
    data.push(...intToBytes(startCollect.mdefLen.y));
    // console.log('2: ', JSON.stringify(data));

    // Append frequency data for each axis
    data.push(...intToBytes(startCollect.mdefFreq.x));
    data.push(...intToBytes(startCollect.mdefFreq.z));
    data.push(...intToBytes(startCollect.mdefFreq.y));
    // console.log('3: ', JSON.stringify(data));

    // Append measurement interval, long waveform length and frequency
    data.push(...intToBytes(startCollect.meaIntv));
    data.push(...intToBytes(startCollect.lwLength));
    data.push(...intToBytes(startCollect.lwFreq));
    data.push(...intToBytes(startCollect.lwIntv));
    // console.log('4: ', JSON.stringify(data));

    // Append sample indication, sample length and frequency
    data.push(startCollect.isSampleInd);
    data.push(...intToBytes(startCollect.indLength));
    data.push(...intToBytes(startCollect.indFreq));
    data.push(...intToBytes(startCollect.indIntv));
    data.push(startCollect.sampleDir);
    // console.log('5: ', JSON.stringify(data));

    // console.log(val, ' ', JSON.stringify(data));

    return sendData(0x01, data);
  };

  const handleData = (data: any) => {
    console.log('Data received:', data[1]);
    // Add handling logic here as per your application needs

    let allVal = 0;
    data.forEach((item: any) => {
      allVal += item % 256;
    });
    if (allVal % 256 !== 0) {
      console.log('======Bluetooth data error, trying again:', allVal);
      return;
    }

    switch (data[1]) {
      case 0x04: {
        const dp = data.slice(3);
        // Process received data
        // const wave = this._transWaveData(dp);
        console.log('0x04', JSON.stringify(dp));

        // if (wave) {
        //   this.waveDataT[wave.index] = wave;
        //   this.percentage =
        //     (Object.keys(this.waveDataT).length * 100) / wave.count;
        //   //console.log(this.percentage)
        // }
        break;
      }
      case 0x06: {
        const dp = data.slice(3, data[2]);
        // Process received data
        _transIndexData(dp);
        // console.log('0x06', JSON.stringify(dp));
        break;
      }
      case 0x05: {
        // if (!this.waveDataT) {
        //   return;
        // }
        // Object.keys(this.waveDataT).forEach(key => {
        //   const p = this.waveDataT[key];
        //   this.resciveData[Math.floor(p.index / 8)] =
        //     this.resciveData[Math.floor(p.index / 8)] | this.statu[p.index % 8];
        // });

        console.log('wahyu');
        const dp = data.slice(3, data[2]);

        _transIndexData(dp);

        // this.sendData(0x05, this.resciveData);
        // if (this.percentage < 100) {
        //   return;
        // }
        // this._processWaveData();
        break;
      }
      default:
        // Handle unknown command
        console.warn(`Unknown command received: ${data[1]}`);
    }
  };

  const _transIndexData = (dp: any) => {
    if (dp.length < 35) {
      console.log('The index data received is too short to process.');
      return null;
    }
    try {
      const Y = dp[0];
      const y = dp[1];
      const M = dp[2];
      const d = dp[3];
      const H = dp[4];
      const m = dp[5];
      const s = dp[6];

      // console.log(JSON.stringify(dp.slice(7, 11)))
      const highAccRms = bytesToFloat(dp.slice(7, 11));
      const lowAccRms = bytesToFloat(dp.slice(11, 15));
      const velRms = bytesToFloat(dp.slice(15, 19));
      // console.log(dp.slice(19, 23))
      const tem = bytesToFloat(dp.slice(19, 23));
      const U = bytesToFloat(dp.slice(23, 27));
      const I = bytesToFloat(dp.slice(27, 31));
      const R = bytesToFloat(dp.slice(31, 35));

      console.log('======highAccRms', highAccRms);
      console.log('======lowAccRms', lowAccRms);
      console.log('======velRms', velRms);
      console.log('======tem', tem);

      return {
        Y,
        y,
        M,
        d,
        H,
        m,
        s,
        highAccRms,
        lowAccRms,
        velRms,
        tem,
        U,
        I,
        R,
      };
    } catch (error) {
      console.log('There was an error when trying to parse index data', error);
      return null;
    }
  };

  const stopCollectTmpData = async () => {
    console.log('Stop Collecting Data');

    setIsDisableStopBtn(true);
    await collectData(4, 0, 0, 1000);
  };

  const collectVibrationData = async () => {
    // percentage = 0;
    // waveDataT = {};
    // resciveData = Array(242).fill(0); // Initialize an array with 242 zeros

    setIsDisableStopBtn(false);

    setMonitoredData(0);
    // await collectData(1, 0, 0, 1000);
    await collectData(2, 0, 0, 3125);
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
    stopCollectTmpData,
    isDisableStopBtn,
  };
}
