export type Target = Record<string, any>;

export type SetterCallback = (target: Target, prop: string, value: any, receiver: any, parentProp?: string) => void

export default function () {
  function createProxy<T extends Target>(target: T, setterCallback?: SetterCallback, parentProp?: string, context?: any) {
    const handler = {
      get(target: T, prop: string, receiver: T) {
        if (typeof target[prop] === 'object' && target[prop] !== null) {
          const props = [parentProp, prop].filter((value) => value)
          return createProxy(Reflect.get.apply(null, arguments), setterCallback, props.join("."), context)
        }
        return Reflect.get.apply(null, arguments);
      },
      set(target: T, prop: string, value: any, receiver: T) {
        Reflect.set.apply(null, arguments);
        setterCallback?.apply(context, [...arguments, parentProp]);
        return true
      }
    }

    return new Proxy<T>(target, handler)
  }

  return {
    createProxy
  }
}
