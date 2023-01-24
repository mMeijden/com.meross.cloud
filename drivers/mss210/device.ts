import Homey from 'homey';
import mqtt, {MqttClient} from 'mqtt';
import {generateRandomString} from "../../meross/utils";

const crypto = require('crypto');
const {v4: uuidv4} = require('uuid');
// const { generateRandomString } = require('./utils');
//const appId = crypto.createHash('md5').update('API' + this.uuid + Math.floor(Math.random() * 100)).digest("hex");
//const appId = crypto.createHash('md5').update('API' + uuidv4()).digest("hex");

class MSS210 extends Homey.Device {


    clientResponseTopic: string | undefined;
    waitingMessageIds: object | undefined;
    uuid: string | undefined;
    key: string | undefined;
    userId: string | undefined;
    appId: string | undefined;
    client: MqttClient | undefined

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {

        this.log('MyDevice has been initialized');
        this.waitingMessageIds = {};
        this.uuid = this.getData().id
        this.log(this.getData())
        this.log(this.getStore())
        this.key = this.getStore().merossUserKey;
        this.userId = this.getStore().merossUserId;
        this.appId = crypto.createHash('md5').update('API' + uuidv4()).digest("hex");
        this.clientResponseTopic = `/app/${this.userId}-${this.appId}/subscribe`
        this.log(this.clientResponseTopic)
        const domain = "eu-iot.meross.com";
       // const domain = "mqtt-eu-3.meross.com";
        const clientId = 'app:' + this.appId;
        const hashedPassword = crypto.createHash('md5').update(this.userId! + this.key!).digest("hex");


        this.client = mqtt.connect({
            'protocol': 'mqtts',
            'host': domain,
            'port': 2001,
            'clientId': clientId,
            'username': this.userId,
            'password': hashedPassword,
            'rejectUnauthorized': true,
            'keepalive': 30,
            'reconnectPeriod': 5000
        });
        //  this.getData().attributes.
        this.registerCapabilityListener('onoff', async (value: any) => {
            this.log("turned on/off", value)
            await this.controlToggle(value)
        });


        this.on('data', (namespace, payload) => {
            console.log('Device: ' + this.uuid + ' ' + namespace + ' - data: ' + JSON.stringify(payload));
            switch (namespace) {
                case 'Appliance.Control.ToggleX':
                    //   this.setValuesToggleX(this.uuid, payload);
                    break;
                case 'Appliance.Control.Toggle':
                    // this.setValuesToggle(this.uuid, payload);
                    break;
                case 'Appliance.System.Online':
                    //adapter.setState(this.uuid + '.online', (payload.online.status === 1), true);
                    break;
                case 'Appliance.Control.Upgrade':
                case 'Appliance.System.Report':
                case 'Appliance.Control.ConsumptionX':
                    break;

                default:
                    console.log('Received unknown data ' + namespace + ': ' + JSON.stringify(payload));
                    console.log('Please send full line from logfile on disk to developer');
            }
        });

        this.client.on('connect', () => {
            this.log("Connected. Subscribe to user topics");
            this.client!.subscribe('/app/' + this.userId + '/subscribe', (err) => {
                if (err) {
                    this.emit('error', err);
                }
                this.log('User Subscribe Done');
            });
            // const responseTopic = `/app/${this.userId}-${this.appId}/subscribe`
            this.client!.subscribe(this.clientResponseTopic!, (err) => {
                if (err) {
                    this.emit('error', err);
                }
                this.log('User Response Subscribe Done');
            });
            this.emit('connected');
        });

        this.client.on('message', (topic:string, message:any) => {
            // message is Buffer
            this.log(topic + ' <-- ' + message.toString());
            message = JSON.parse(message.toString());
            if (message.header.from && !message.header.from.includes(this.uuid)) return;
            // {"header":{"messageId":"14b4951d0627ea904dd8685c480b7b2e","namespace":"Appliance.Control.ToggleX","method":"PUSH","payloadVersion":1,"from":"/appliance/1806299596727829081434298f15a991/publish","timestamp":1539602435,"timestampMs":427,"sign":"f33bb034ac2d5d39289e6fa3dcead081"},"payload":{"togglex":[{"channel":0,"onoff":0,"lmTime":1539602434},{"channel":1,"onoff":0,"lmTime":1539602434},{"channel":2,"onoff":0,"lmTime":1539602434},{"channel":3,"onoff":0,"lmTime":1539602434},{"channel":4,"onoff":0,"lmTime":1539602434}]}}

            // If the message is the RESP for some previous action, process return the control to the "stopped" method.
            // @ts-ignore
            if (this.waitingMessageIds[message.header.messageId]) {
                // @ts-ignore
                if (this.waitingMessageIds[message.header.messageId].timeout) {
                    // @ts-ignore
                    clearTimeout(this.waitingMessageIds[message.header.messageId].timeout);
                }
                // @ts-ignore
                this.waitingMessageIds[message.header.messageId].callback(null, message.payload || message);

                // @ts-ignore
                delete this.waitingMessageIds[message.header.messageId];
            } else if (message.header.method === "PUSH") { // Otherwise process it accordingly
                const namespace = message.header ? message.header.namespace : '';
                //console.log("Found message");
                this.emit('data', namespace, message.payload || message);
            }
            this.emit('rawData', message);
        });
        this.client.on('error', (error) => {
            this.log(error)
            this.emit('error', error.toString());
        });
        this.client.on('close', (error:any) => {
            console.log("Client close");
            console.log(error)
        });
        this.client.on('reconnect', () => {
            this.emit('reconnect');
            console.log("reconnect");
        });
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.log('MyDevice has been added');
    }

    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('MyDevice settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name: string) {
        this.log('MyDevice was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('MyDevice has been deleted');
    }

    async publishMessage(method: string, namespace: string, payload: object) {
        const messageId = crypto.createHash('md5').update(generateRandomString(16)).digest("hex");
        const timestamp = Math.round(new Date().getTime() / 1000);
        const signature = crypto.createHash('md5').update(messageId + this.key + timestamp).digest("hex");
        const data = {
            "header": {
                "from": this.clientResponseTopic,
                "messageId": messageId, // Example: "122e3e47835fefcd8aaf22d13ce21859"
                "method": method, // Example: "GET",
                "namespace": namespace, // Example: "Appliance.System.All",
                "payloadVersion": 1,
                "sign": signature, // Example: "b4236ac6fb399e70c3d61e98fcb68b74",
                "timestamp": timestamp
            },
            "payload": payload
        };
        this.log("Invoking mqtt client")
        const resp = this.client!.publish('/appliance/' + this.getData().id + '/subscribe', JSON.stringify(data));
        this.log(resp)
    // if (callback) {
    //   this.waitingMessageIds[messageId] = {};
    //   this.waitingMessageIds[messageId].callback = callback;
    //   this.waitingMessageIds[messageId].timeout = setTimeout(() => {
    //     //console.log('TIMEOUT');
    //     if (this.waitingMessageIds[messageId].callback) {
    //       this.waitingMessageIds[messageId].callback(new Error('Timeout'));
    //     }
    //     delete this.waitingMessageIds[messageId];
    //   }, 20000);
    // }
    return messageId;
    }

    async controlToggle(toggleState: boolean) {
        const payload = {
            "toggle": {
                "onoff": toggleState ? 1 : 0
            }
        };
        this.log("Payload: " + JSON.stringify(payload));
        const response = await this.publishMessage("SET", "Appliance.Control.Toggle", payload);
        this.log(response)
        return response
    }

    // async createNewMQTTClient(){
    //     this.client = await mqtt.connectAsync()
    // }
}

module.exports = MSS210;

