import React from 'react';
import {View, Button} from 'react-native';
// import crypto from "crypto";
import {Buffer} from '@craftzdog/react-native-buffer';
// import scrypt from 'scrypt-js';
import {scrypt} from 'react-native-fast-crypto';

const PasswordScreen = () => {
  const onCekPassword = async () => {
    const startTime = performance.now();
    const salt = '3e57836d897de4c6541d54b6a5c90995';
    const plainText = 'user123';
    console.log('salt: ', salt);
    console.log(
      "Buffer.from(salt, 'hex') in React Native:",
      Buffer.from(salt, 'hex').toString('hex'),
    );
    console.log(
      'Plain text in React Native:',
      Buffer.from(plainText, 'utf-8').toString('hex'),
    );
    const plainTextBuffer = Buffer.from(plainText, 'utf-8');
    const saltBuffer = Buffer.from(salt, 'hex');

    const config = {
      N: 16384, // CPU/memory cost
      r: 8, // Block size
      p: 1, // Parallelization
    };

    const N = 16384,
      r = 8,
      p = 1,
      dkLen = 64;

    try {
      // console.log(crypto.randomBytes(32).toString('hex'));
      console.log('EHEHEHE');
      const key = await scrypt(plainTextBuffer, saltBuffer, N, r, p, dkLen);
      console.log('key: ', key);
      console.log('Derived key (hex):', Buffer.from(key).toString('hex'));
      const endTime = performance.now();
      console.log('elapsed Time: ', (endTime - startTime) / 1000);
    } catch (error) {
      console.error('Error:');
    }
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Button title="Cek Password" onPress={onCekPassword} />
    </View>
  );
};

export default PasswordScreen;
