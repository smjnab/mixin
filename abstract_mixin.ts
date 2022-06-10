/**
 * Base mixin class to derive mixins from.
 *
 * `Instructions for making mixins:` 
 * 
 * All derived mixin classes must have a `MixinClassName()` as an initializer.  
 * All derived mixin classes must have a `MixinClassNameDestroy()` as a destructor.  
 * 
 * `class MixinClassName` should be documented properly to inform of any conf object needed for the `MixinClassName()` initializer.  
 * 
 * Mixin classes that has requirements on what type of class that can implement them, can call `Mixin.notApplicable()` for fail safety. Example:  
 * ```
 *  private MixinSprite() {
 *      // "this" is the class instance applying mixin, MixinSprite is the mixin and GameObject the expected class.
        if (Mixin.notApplicable(this, MixinSprite, GameObject)) return;
        (...)
    }
 * ```
 *  
 * In this case also create an interface for the mixin to get working types in the mixin class. Example:
 * ```
 * export interface MixinSprite extends GameObject { }
 * ```
 * 
 * By default a Mixin is only initialized one time, but in some cases you might want to force repeated initializations. Use the static 
 * multiMixin boolean to enable this. Set it to true in the mixins MixinClassName initializer.
 *
 * `Instructions for classes using mixins:`
 * 
 * Classes using mixins call `mixinInits()` in their constructor. Example:  
 * ```
 * Mixin.mixinInits(this, ClassApplyingMixins, MixinClassName1, { mixin: MixinClassName2, conf: {name: "a string", active: true, ...} });
 * ```  
 * 
 * Classes using mixins call `this.mixinDestroys(ClassApplyingMixins)` in their destructor.   
 * 
 * Classes using the mixins must create an interface with the same name as ClassApplyingMixins. Example:    
 * ```
 * export interface ClassApplyingMixins extends MixinClassName1, MixinClassName2 { }
 * ```
 */
export abstract class Mixin {
    private mixinsApplied: Map<typeof Mixin, { classApplyingMixin: any, destroyMethod: () => void }>; // Track all applied mixins for a class.
    private mixinsDestroyed: number; // Track mixins destroyed.
    protected static multiMixin: boolean;  // By default a mixin is only applied once, some have a tree that might need multiple applications.

    /**
     * Call to initialize all applied Mixins.
     * 
     * @param instanceApplyingMixin instance of the class using mixins.
     * @param classOfInstance the instance class that is using mixins.
     * @param mixinClasses the mixin classes to apply and initialize.
     */
    protected static mixinInits(instanceApplyingMixin: any, classOfInstance: any, ...mixinClasses: (typeof Mixin | { mixin: typeof Mixin, conf?: {} })[]) {
        // Track all applied mixins for a class.
        if (instanceApplyingMixin.mixinsApplied == undefined) {
            Mixin.applyMixin(instanceApplyingMixin, Mixin); // Apply Mixin to all classes using mixins.

            instanceApplyingMixin.mixinsApplied = new Map();
        }

        let doesNotHaveMixin = false;

        mixinClasses.forEach((mixinClass: any) => {
            // Apply mixin to instance of a class using mixins.
            if (doesNotHaveMixin = (Mixin.hasMixin(instanceApplyingMixin, mixinClass.mixin ? mixinClass.mixin : mixinClass) == false)) {
                Mixin.applyMixin(instanceApplyingMixin, (mixinClass as any).mixin || mixinClass);
            }

            // Execute mixins initialize method with optional conf object. Do it multiple times if multiMixin.
            if (mixinClass.multiMixin || mixinClass.mixin?.multiMixin || doesNotHaveMixin) {
                (instanceApplyingMixin as any)[mixinClass.mixin ? mixinClass.mixin.name : mixinClass.name](mixinClass.conf);
            }

            // Set mixin applied and store its destroy method.
            if (doesNotHaveMixin) {
                let destroyMethod = mixinClass.mixin ? mixinClass.mixin.name + "Destroy" : mixinClass.name + "Destroy";

                instanceApplyingMixin.mixinsApplied.set(mixinClass.mixin ? mixinClass.mixin : mixinClass, {
                    classApplyingMixin: classOfInstance, destroyMethod: (instanceApplyingMixin as any)[destroyMethod].bind(instanceApplyingMixin)
                });
            }
        });
    }

    /**
     * Call to destroy all applied mixins.
     * 
     * @param classApplyingMixin the Class that applied the mixin (the class that runs this.mixinDestroys).
     */
    protected mixinDestroys(classApplyingMixin: any) {
        if (this.mixinsApplied) {
            // Filter out the mixins applied by this class, then reverse it to execute destroys in reverse order from applied.
            let tempArray = Array.from(this.mixinsApplied).filter(value => value[1].classApplyingMixin == classApplyingMixin).reverse();

            // Execute destroys and count how many destructions.
            if (this.mixinsDestroyed == undefined) this.mixinsDestroyed = 0;

            tempArray.forEach(mixin => {
                mixin[1].destroyMethod();
                this.mixinsDestroyed++;
            });

            // If destructions and applied match, clear and remove.
            if (this.mixinsApplied.size == this.mixinsDestroyed) {
                this.mixinsApplied.clear();

                delete this.mixinsApplied;
                delete this.mixinsDestroyed;
            }
        }
    }

    /**
     * If a mixin has requirements on type of class it can be mixed into, use this to keep yourself from making mistakes.
     * 
     * @param instanceApplyingMixin instance of a class that is trying to apply a mixin.
     * @param mixinClass the mixin to apply.
     * @param instanceRequiredClass the class of an instance the mixin expects to be applied to.
     * @returns 
     */
    static notApplicable(instanceApplyingMixin: any, mixinClass: any, instanceRequiredClass: any) {
        if ((instanceApplyingMixin instanceof instanceRequiredClass) == false && Mixin.hasMixin(instanceApplyingMixin, instanceRequiredClass) == false) {
            console.error(
                instanceApplyingMixin.constructor.name + " is not an instance of " + instanceRequiredClass.name +
                " and can not use mixin " + mixinClass.name + ". Correct this fault as it can lead to unpredictable behaviour."
            );

            return true;
        }

        return false;
    }

    /**
    * See if an instance of a class with mixins has a particular mixin.
    *
    * @param instanceWithMixins
    * @param mixinClass
    */
    static hasMixin(instanceWithMixins: Mixin, mixinClass: typeof Mixin) {
        if (instanceWithMixins.mixinsApplied == undefined) return false;
        return instanceWithMixins.mixinsApplied.has(mixinClass);
    }

    /**
     * Apply a mixin to the instance of a class using mixins. (Called by mixinInits, not need to manually call.).
     * 
     * @param instanceApplyingMixin the object instance of a class using a mixin.
     * @param mixinClass the mixin class to apply.
     */
    static applyMixin(instanceApplyingMixin: any, mixinClass: any) {
        const constructorSave = instanceApplyingMixin.constructor; // Because constructor changes to last applied mixin class, save the original constructor.

        Object.getOwnPropertyNames(mixinClass.prototype).forEach(name => {
            Object.defineProperty(instanceApplyingMixin, name, Object.getOwnPropertyDescriptor(mixinClass.prototype, name));
        });

        instanceApplyingMixin.constructor = constructorSave; // Re-apply original constructor.
    }
}
