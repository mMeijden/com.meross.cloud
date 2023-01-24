import Homey from 'homey';

class MyDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    // @ts-ignore
    const devicesList = await this.homey.app.merossClient.listDevices()
    this.log(devicesList)
    //@ts-ignore
    const merossUserId = this.homey.app.merossClient.cloudCredentials?.userId
    //@ts-ignore
    const merossUserKey = this.homey.app.merossClient.cloudCredentials?.key
    this.log(merossUserKey)
    this.log(devicesList[0].devName)
    const capableDevices = []
    //todo: this still does not filter purely for the mss210
    //todo: create interface for devices to remove ts-ignores
    for(const d of devicesList){
      capableDevices.push({
        // @ts-ignore
        name: d.devName,
        data: {
          // @ts-ignore
          id: d.uuid,

        },
        store: {
          // @ts-ignore
          deviceType: d.deviceType,
          // @ts-ignore
          cluster: d.cluster,
          // @ts-ignore
          domain: d.domain,
          // @ts-ignore
          onlineStatus: d.onlineStatus,
          merossUserId: merossUserId,
          merossUserKey: merossUserKey
        }
      })
    }
    return capableDevices;
  }

}

module.exports = MyDriver;
