import { Mixin } from "./abstract_mixin";


//////////////////////////////////////////////////////////////////////////////////////////////////
// Mixin 1. As plain as a mixin can get.
//////////////////////////////////////////////////////////////////////////////////////////////////

export class MixinNumber extends Mixin {
    myNumber: number;

    MixinNumber() {
        this.myNumber = 1;
    }

    MixinNumberDestroy() {
        delete this.myNumber;
    }

    getNumber() {
        return this.myNumber;
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////
// Mixin 2. Mixin that depends on the applier having a specific class (in this case another mixin).
//////////////////////////////////////////////////////////////////////////////////////////////////

export type MixinStringConf = {
    defaultValue?: string;
}

export class MixinString extends Mixin {
    myString: string;

    MixinString(conf: MixinStringConf) {
        if (Mixin.notApplicable(this, MixinString, MixinNumber)) return;

        this.myString = conf.defaultValue;
    }

    MixinStringDestroy() {
        delete this.myString;
    }

    getString() {
        return this.myString || "My value: ";
    }

    joinWithNumber() {
        this.myString = this.getString() + this.getNumber();
    }
}
export interface MixinString extends MixinNumber { }


//////////////////////////////////////////////////////////////////////////////////////////////////
// Class 1. No mixins, only a class to derive from as an example of combining with mixins.
//////////////////////////////////////////////////////////////////////////////////////////////////

export abstract class BaseClass {
    constructor() {
        console.log("BaseClass is here!");
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////
// Class 2. Using mixins and extends BaseClass.
//////////////////////////////////////////////////////////////////////////////////////////////////

export class Combinator extends BaseClass {
    constructor() {
        super();

        Mixin.mixinInits(this, Combinator, MixinNumber, { mixin: MixinString, conf: { defaultValue: "Fave nr is: " } as MixinStringConf });
    }

    destroy() {
        this.mixinDestroys(Combinator);
    }
}
export interface Combinator extends MixinNumber, MixinString { }


//////////////////////////////////////////////////////////////////////////////////////////////////
// Demo of using the mixin crafted class.
//////////////////////////////////////////////////////////////////////////////////////////////////

const combinator = new Combinator();

console.log(combinator.getString());

combinator.joinWithNumber();

console.log(combinator.getString());
