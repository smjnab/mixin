# Mixins for typescript
A mixin solution originally based on the alternative pattern found at https://www.typescriptlang.org/docs/handbook/mixins.html

A mixin solution that can be combined with regular inheritance and allows for mixins that have a constructor-like initialization.

Mixins can be added to classes, derived classes and to other mixins. Mixins can have constraints and warn when a contraint is not met. See the example.ts file for a demo of basic usage.

# Creating a mixin
Creating a new mixin is done by extending a new class from the abstract Mixin class.

```typescript
export type MixinStringConf = {
  defaultValue?: string
}

export class MixinString extends Mixin {
  myString: string;

  MixinString(conf: MixinStringConf) {
      this.myString = conf.defaultValue || "MyString";
  }

  MixinStringDestroy() {
      delete this.myString;
  }

  getString() {
      return this.myString;
  }
}
```

# Using a mixin
Add a mixin to a class by using the Mixin.mixinInits method and by creating an interface to get type functionality.

```typescript
export class MyClass {
  constructor(myString?: string){
    // If not using a config object for the mixin, just pass the mixin class.
    Mixin.mixinInits(this, MyClass, MixinString);
    
    // If using a config object, pass the class and config.
    // Mixin.mixinInits(this, MyClass, { mixin: MixinString, conf: { defaultValue: myString } as MixinStringConf });
    
    // Possible to init many mixins
    // Mixin.mixinInits(this, MyClass, 
    //  { mixin: MixinString, conf: { defaultValue: "MyOwnString" } as MixinStringConf },
    //  ASecondMixin,
    //  ThirdMixin,
    //  { mixin: MixinNumber, conf: { defaultValue: 1234 } as MixinNumberConf }
    // );
  }
  
  destroy(){
    // All mixins have a destroy method, execute them by running mixinDestroys. MyClass is passed to only 
    // run destroys of mixins this class specifically applied.
    this.mixinDestroys(MyClass);
  }
}
export interface MyClass extends MixinString { }
```
