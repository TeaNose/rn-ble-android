import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  buttonContainer: {
    padding: 16,
  },
  deviceItemContainer: {
    marginVertical: 8,
    borderBottomColor: 'grey',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceItem: {
    flex: 1,
  },
  connectButtonContainer: {
    flex: 0.5,
  },
  title: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  loaderContainer: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedDeviceContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'grey',
    padding: 8,
  },
  data: {
    marginBottom: 4,
  },
  containerBtnStopCollecting: {
    marginVertical: 20,
  },
});

export default styles;
