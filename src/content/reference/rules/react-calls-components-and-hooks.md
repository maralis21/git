---
title: React calls Components and Hooks
---

<Intro>
React is responsible for rendering Components and Hooks when necessary to optimize the user experience. It is declarative: you tell React what to render in your Component’s logic, and React will figure out how best to display it to your user.
</Intro>

<InlineToc />

---

## Never call Component functions directly {/*never-call-component-functions-directly*/}
Components should only be used in JSX. Don't call them as regular functions. React should call it.

React must decide when your Component function is called [during rendering](/reference/rules/components-and-hooks-must-be-pure#how-does-react-run-your-code). In React, you do this using JSX.

```js {2}
function BlogPost() {
  return <Layout><Article /></Layout>; // ✅ Good: Only use Components in JSX
}
```

```js {2}
function BlogPost() {
  return <Layout>{Article()}</Layout>; // 🔴 Bad: Never call them directly
}
```

If a Component contains Hooks, it's easy to violate the [Rules of Hooks](/reference/rules/rules-of-hooks) when Components are called directly in a loop or conditionally.

Letting React orchestrate rendering also allows a number of benefits:

* **Components become more than functions.** React can augment them with features like _local state_ through Hooks that are tied to the Component's identity in the tree.
* **Component types participate in reconciliation.** By letting React call your Components, you also tell it more about the conceptual structure of your tree. For example, when you move from rendering `<Feed>` to the `<Profile>` page, React won’t attempt to re-use them.
* **React can enhance your user experience.** For example, it can let the browser do some work between Component calls so that re-rendering a large Component tree doesn’t block the main thread.
* **A better debugging story.** If Components are first-class citizens that the library is aware of, we can build rich developer tools for introspection in development.
* **More efficient reconciliation.** React can decide exactly which Components in the tree need re-rendering and skip over the ones that don't. That makes your app faster and more snappy.

---

## Never pass around Hooks as regular values {/*never-pass-around-hooks-as-regular-values*/}

Hooks should only be called inside of Components or Hooks. Never pass it around as a regular value.

Hooks allow you to augment a Component with React features. They should always be called as a function, and never passed around as a regular value. This enables _local reasoning_, or the ability for developers to understand everything a Component can do by looking at that Component in isolation.

Breaking this rule will cause React to not automatically optimize your Component.

### Don't dynamically mutate a Hook {/*dont-dynamically-mutate-a-hook*/}

Hooks should be as "static" as possible. This means you shouldn't dynamically mutate them. For example, this means you shouldn't write higher order Hooks:

```js {2}
function ChatInput() {
  const useDataWithLogging = withLogging(useData); // 🔴 Bad: don't write higher order Hooks
  const data = useDataWithLogging();
}
```

Hooks should be immutable and not be mutated. Instead of mutating a Hook dynamically, create a static version of the Hook with the desired functionality.

```js {2,6}
function ChatInput() {
  const data = useDataWithLogging(); // ✅ Good: Create a new version of the Hook
}

function useDataWithLogging() {
  // ... Create a new version of the Hook and inline the logic here
}
```

### Don't dynamically use Hooks {/*dont-dynamically-use-hooks*/}

Hooks should also not be dynamically used: for example, instead of doing dependency injection in a Component by passing a Hook as a value:

```js {2}
function ChatInput() {
  return <Button useData={useDataWithLogging} /> // 🔴 Bad: don't pass Hooks as props
}
```

You should always inline the call of the Hook into that Component and handle any logic in there.

```js {6}
function ChatInput() {
  return <Button />
}

function Button() {
  const data = useDataWithLogging(); // ✅ Good: Use the Hook directly
}

function useDataWithLogging() {
  // If there's any conditional logic to change the Hook's behavior, it should be inlined into
  // the Hook
}
```

This way, `<Button />` is much easier to understand and debug. When Hooks are used in dynamic ways, it increases the complexity of your app greatly and inhibits local reasoning, making your team less productive in the long term. It also makes it easier to accidentally break the [Rules of Hooks](/reference/rules/rules-of-hooks) that Hooks should not be called conditionally. If you find yourself needing to mock Components for tests, it's better to mock the server instead to respond with canned data. If possible, it's also usually more effective to test your app with end-to-end tests.

