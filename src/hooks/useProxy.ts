export type Target = Record<string, any>;

export type SetterInterceptor = (target: Target, prop: string, value: any, receiver: any, parentProp?: string) => void

export default function () {
  function createProxy<T extends Target>(target: T, setterInterceptor: SetterInterceptor, parentProp?: string) {
    const handler = {
      get(target: T, prop: string, receiver: T) {
        if (typeof target[prop] === 'object' && target[prop] !== null) {
          const props = [parentProp, prop].filter((value) => value)
          return createProxy(Reflect.get.apply(null, arguments), setterInterceptor, props.join("."))
        }
        return Reflect.get.apply(null, arguments);
      },
      set(target: T, prop: string, value: any, receiver: T) {
        setterInterceptor.apply(null, [...arguments, parentProp]);
        return Reflect.set.apply(null, arguments)
      }
    }

    return new Proxy<T>(target, handler)
  }

  return {
    createProxy
  }
}
