export abstract class ConfigSupplicant {

    private _state: boolean = false;

    constructor({ paths, config }: { paths: Array<string>, config: object }) {
        this.enable = this.enable.bind(this);
        this.disable = this.disable.bind(this);

        try {

            let state = paths.reduce<any>((previousValue: any, currentValue: string) => {
                return previousValue[currentValue];
            }, config);
            //  We need to know the value assigned to the reference path (i.e., paths); 
            //  hence, drill into the arbitrary config object in order to obtain the value.

            if (this._state !== state) {
                if (state === true) {
                    setTimeout(this.enable);
                } else {
                    setTimeout(this.disable);
                }

                this._state = state;
            }

        } catch (e) {
            setTimeout(this.enable);
            this._state = true;
            console.error(e);
        }
    }

    protected abstract enable(): void;
    protected abstract disable(): void;
}