export abstract class ConfigSupplicant {

    constructor({ paths, config }: { paths: Array<string>, config: { [key: string]: any } | null }) {
        this.enable = this.enable.bind(this);
        this.disable = this.disable.bind(this);

        try {

            if (!config) {
                throw new Error();
            }

            let state = paths.reduce<any>((previousValue: { [key: string]: any }, currentValue: string) => {
                return previousValue[currentValue];
            }, config);
            //  We need to know the value assigned to the reference path (i.e., paths); 
            //  hence, drill into the arbitrary config object in order to obtain the value.    

            if (state === false) {
                setTimeout(this.disable);
            } else if (state === true) {
                setTimeout(this.enable);
            }
            else {
                throw new Error();
            }


        } catch (e) {
            setTimeout(this.enable);
            //  The default is for all events to be enabled; hence, we don't need to log anything here.
        }
    }

    protected abstract enable(): void;
    protected abstract disable(): void;
}