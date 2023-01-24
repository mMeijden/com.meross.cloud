import Homey from 'homey';
import {MerossHTTPClient} from "./meross";

class MyApp extends Homey.App {
    public merossClient: MerossHTTPClient | undefined;


    /**
     * onInit is called when the app is initialized.
     */

    getMerossClient(){
        return this.merossClient
    }

    async onInit() {
        this.log('MerossClient has been initialized');
        this.homey.settings.on('set', this.onSettingsChanged.bind(this));
        this.instantiateHTTPClient()
    }

    instantiateHTTPClient(){
        const username = this.homey.settings.get('username');
        const password = this.homey.settings.get('password');
        if (username && password) {
            this.log("Configuring new Meross client")
            this.merossClient = new MerossHTTPClient(username, password)
        }else{
            this.log("Not configuring MerossClient yet. There are no settings.")
        }
    }

    onSettingsChanged() {
        this.log("Updating settings. Recreating MerossHTTPClient");
        this.instantiateHTTPClient();
    }


}

module.exports = MyApp;
