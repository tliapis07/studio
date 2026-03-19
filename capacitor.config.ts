import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timnyc.salesstream',
  appName: 'SalesStream',
  webDir: 'C:/Users/Tim/Desktop/SalesStream/App Publishes',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
