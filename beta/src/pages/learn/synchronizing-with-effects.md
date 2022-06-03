---
title: 'Synchronizing with Effects'
---

<Intro>

Some components need to synchronize with external systems. For example, you might want to control a non-React component based on the React state, set up a server connection, or send an analytics log when a component appears on the screen. *Effects* let you run some code after rendering so that you can synchronize your component with some system outside of React.

</Intro>

<YouWillLearn>

- What effects are
- How effects are different from events
- How to declare an effect in your component
- Why effects run twice in development mode
- How to optimize effects with dependencies

</YouWillLearn>

## What are effects and how are they different from events? {/*what-are-effects-and-how-are-they-different-from-events*/}

Before getting to effects, you need to be familiar with two types of logic inside React components:

- **Rendering code** (introduced in [Describing the UI](/learn/describing-the-ui)) lives at the top level of your component. This is where you take the props and state, transform them, and return the JSX you want to see on the screen. [Rendering code must be pure.](/learn/keeping-components-pure) Like a math formula, it should only _calculate_ the result, but not do anything else.

- **Event handlers** (introduced in [Adding Interactivity](/learn/adding-interactivity)) are nested functions inside your components that *do* things rather than just calculate them. An event handler might update an input field, submit an HTTP POST request to buy a product, or navigate the user to another screen. Event handlers contain ["side effects"](https://en.wikipedia.org/wiki/Side_effect_(computer_science)) (they change the program's state) and are caused by a specific user action (for example, a button click or typing).

Sometimes this isn't enough. Consider a `ChatRoom` component that must connect to the chat server whenever it's visible on the screen. Connecting to a server is not a pure calculation (it's a side effect) so it can't happen during rendering. However, there is no single particular event like a click that causes `ChatRoom` to be displayed.

***Effects* let you specify side effects that are caused by rendering itself, rather than by a particular event.** Sending a message in the chat is an *event* because it is directly caused by the user clicking a specific button. However, setting up a server connection is an *effect* because it needs to happen regardless of which interaction caused the component to appear. Effects run at the end of the [rendering process](/learn/render-and-commit) after the screen updates. This is a good time to synchronize the React components with some external system (like network or a third-party library).

## You might not need an effect {/*you-might-not-need-an-effect*/}

**Don't rush to add effects to your components.** Keep in mind that effects are typically used to "step out" of your React code and synchronize with some *external* system. This includes browser APIs, third-party widgets, network, and so on. If your effect only adjusts some state based on other state, [you might not need an effect.](/learn/you-might-not-need-an-effect)

## How to write an effect {/*how-to-write-an-effect*/}

To write an effect, follow these three steps:

1. **Declare an effect.** By default, your effect will run after every render.
2. **Specify the effect dependencies.** Most effects should only re-run *when needed* rather than after every render. For example, a fade-in animation should only trigger when a component appears. Connecting and disconnecting to a chat room should only happen when the component appears and disappears, or when the chat room changes. You will learn how to control this by specifying *dependencies.*
3. **Add cleanup if needed.** Some effects need to specify how to stop, undo, or clean up whatever they were doing. For example, "connect" needs "disconnect," "subscribe" needs "unsubscribe," and "fetch" needs either "cancel" or "ignore". You will learn how to do this by returning a *cleanup function*.

Let's look at each of these steps in detail.

### Step 1: Declare an effect {/*step-1-declare-an-effect*/}

To declare an effect in your component, import the [`useEffect` Hook](/api/useeffect) from React:

```js
import { useEffect } from 'react';
```

Then, call it at the top level of your component and put some code inside your effect:

```js {2-4}
function MyComponent() {
  useEffect(() => {
    // Code here will run after *every* render
  });
  return <div />;
}
```

Every time your component renders, React will update the screen *and then* run the code inside `useEffect`. In other words, **`useEffect` "delays" a piece of code from running until that render is reflected on the screen.**

Let's see how you can use an effect to synchronize with an external system. Consider a `<VideoPlayer>` React component. It would be nice to control whether it's playing or paused by passing an `isPlaying` prop to it:

```js
<VideoPlayer isPlaying={isPlaying} />;
```

Your custom `VideoPlayer` component renders the built-in browser [`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) tag:

```js
function VideoPlayer({ src, isPlaying }) {
  // TODO: do something with isPlaying
  return <video src={src} />;
}
```

However, the browser `<video>` tag does not have an `isPlaying` prop. The only way to control it is to manually call the [`play()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play) and [`pause()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/pause) methods on the DOM element. **You need to synchronize the value of `isPlaying` prop, which tells whether the video _should_ currently be playing, with imperative calls like `play()` and `pause()`.**

We'll need to first [get a ref](/learn/manipulating-the-dom-with-refs) to the `<video>` DOM node.

You might be tempted to try to call `play()` or `pause()` during rendering, but that isn't correct:

<Sandpack>

```js
import { useState, useRef, useEffect } from 'react';

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);

  if (isPlaying) {
    ref.current.play();   // Calling these while rendering isn't allowed.
  } else {
    ref.current.pause();  // Also, this crashes.
  }

  return <video ref={ref} src={src} loop playsInline />;
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <>
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  );
}
```

```css
button { display: block; margin-bottom: 20px; }
video { width: 250px; }
```

</Sandpack>

The reason this code isn't correct is that it tries to do something with the DOM node during rendering. In React, [rendering should be a pure calculation](/learn/keeping-components-pure) of JSX and should not contain side effects like modifying the DOM.

Moreover, by the time `VideoPlayer` is called for the first time, its DOM does not exist yet! There isn't any DOM node yet to call `play()` or `pause()` on, because React doesn't know what DOM to create until after you return the JSX.

The solution here is to **wrap the side effect with `useEffect` to move it out of the rendering calculation:**

```js {6,12}
import { useEffect, useRef } from 'react';

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      ref.current.play();
    } else {
      ref.current.pause();
    }
  });

  return <video ref={ref} src={src} loop playsInline />;
}
```

By wrapping the DOM update in an effect, you let React update the screen first. Then your effect runs.

When your `VideoPlayer` component renders (either the first time or if it re-renders), a few things will happen. First, React will update the screen, ensuring the `<video>` tag is in the DOM with the right props. Then React will run your effect. Finally, your effect will call `play()` or `pause()` depending on the value of `isPlaying` prop.

Press Play/Pause multiple times and see how the video player stays synchronized to the `isPlaying` value:

<Sandpack>

```js
import { useState, useRef, useEffect } from 'react';

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      ref.current.play();
    } else {
      ref.current.pause();
    }
  });

  return <video ref={ref} src={src} loop playsInline />;
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <>
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  );
}
```

```css
button { display: block; margin-bottom: 20px; }
video { width: 250px; }
```

</Sandpack>

In this example, the "external system" you synchronized to React state was the browser media API. You can use a similar approach to wrap legacy non-React code (like jQuery plugins) into declarative React components.

*(Note that controlling a video player is much more complex in practice. Calling `play()` may fail, the user might play or pause using the built-in browser controls, and so on. This example is very simplified and incomplete.)*

<Gotcha>

By default, effects run after *every* render. This is why code like this will **produce an infinite loop:**

```js
const [count, setCount] = useState(0);
useEffect(() => {
  setCount(count + 1);
});
```

Effects run as a *result* of rendering. Setting state *triggers* rendering. Setting state immediately in an effect is like plugging a power outlet into itself. The effect runs, it sets the state, which causes a re-render, which causes the effect to run, it sets the state again, this causes another re-render, and so on.

Effects should usually synchronize your components with an *external* system. If there's no external system and you only want to adjust some state based on other state, [you might not need an effect.](/learn/you-might-not-need-an-effect)

</Gotcha>

### Step 2: Specify the effect dependencies {/*step-2-specify-the-effect-dependencies*/}

By default, effects run after *every* render. Often, this is **not what you want:**

- Sometimes, it's slow. Synchronizing with an external system is not always instant, so you might want to skip doing it unless it's necessary. For example, you don't want to reconnect to the chat server on every keystroke.
- Sometimes, it's wrong. For example, you don't want to trigger a component fade-in animation on every keystroke. The animation should only play once when the component appears for the first time.

To demonstrate the issue, here is the previous example with a few `console.log` calls and a text input that updates the parent component's state. Open the console and notice how typing causes the effect to re-run:

<Sandpack>

```js
import { useState, useRef, useEffect } from 'react';

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      console.log('Calling video.play()');
      ref.current.play();
    } else {
      console.log('Calling video.pause()');
      ref.current.pause();
    }
  });

  return <video ref={ref} src={src} loop playsInline />;
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState('');
  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  );
}
```

```css
input, button { display: block; margin-bottom: 20px; }
video { width: 250px; }
```

</Sandpack>

You can tell React to **skip unnecessarily re-running the effect** by specifying an array of *dependencies* as the second argument to the `useEffect` call. Start by adding an empty `[]` array to the above example on line 14:

```js {3}
  useEffect(() => {
    // ...
  }, []);
```

You should see an error saying `React Hook useEffect has a missing dependency: 'isPlaying'`:

<Sandpack>

```js
import { useState, useRef, useEffect } from 'react';

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      console.log('Calling video.play()');
      ref.current.play();
    } else {
      console.log('Calling video.pause()');
      ref.current.pause();
    }
  }, []); // This causes an error

  return <video ref={ref} src={src} loop playsInline />;
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState('');
  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  );
}
```

```css
input, button { display: block; margin-bottom: 20px; }
video { width: 250px; }
```

</Sandpack>

The problem is that the code inside of your effect *depends on* the `isPlaying` prop to decide what to do, but this dependency was not explicitly declared. To fix this issue, add `isPlaying` to the dependency array:

```js {2,7}
  useEffect(() => {
    if (isPlaying) { // It's used here...
      // ...
    } else {
      // ...
    }
  }, [isPlaying]); // ...so it must be declared here!
```

Now all dependencies are declared, so there is no error. Specifying `[isPlaying]` as the dependency array tells React that it should skip re-running your effect if `isPlaying` is the same as it was during the previous render. With this change, typing into the input doesn't cause the effect to re-run, but pressing Play/Pause does:

<Sandpack>

```js
import { useState, useRef, useEffect } from 'react';

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      console.log('Calling video.play()');
      ref.current.play();
    } else {
      console.log('Calling video.pause()');
      ref.current.pause();
    }
  }, [isPlaying]);

  return <video ref={ref} src={src} loop playsInline />;
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState('');
  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  );
}
```

```css
input, button { display: block; margin-bottom: 20px; }
video { width: 250px; }
```

</Sandpack>

The dependency array can contain multiple dependencies. React will only skip re-running the effect if *all* of the dependencies you specify have exactly the same values as they had during the previous render. React compares the dependency values using the [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) comparison. See the [`useEffect` API reference](/apis/useeffect#reference) for more details.

**Notice that you can't "choose" your dependencies.** You will get a lint error if the dependencies you specified don't match what React expects based on the code inside your effect. This helps catch many bugs in your code. If your effect uses some value but you *don't* want to re-run the effect when it changes, you'll need to *edit the effect code itself* to not "need" that dependency. Learn more about this in [Specifying the Effect Dependencies](/learn/specifying-effect-dependencies).

<Gotcha>

The behaviors *without* the dependency array and with an *empty* `[]` dependency array are very different:

```js {3,7,11}
useEffect(() => {
  // This runs after every render
});

useEffect(() => {
  // This runs only on mount (when the component appears)
}, []);

useEffect(() => {
  // This runs on mount *and also* if either a or b have changed since the last render
}, [a, b]);
```

We'll take a close look at what "mount" means in the next step.

</Gotcha>

<DeepDive title="Why was the ref omitted from the dependency array?">

This effect uses _both_ `ref` and `isPlaying`, but only `isPlaying` is declared as a dependency:

```js {9}
function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);
  useEffect(() => {
    if (isPlaying) {
      ref.current.play();
    } else {
      ref.current.pause();
    }
  }, [isPlaying]);
```

This is because the `ref` object has a *stable identity:* React guarantees [you'll always get the same object](/apis/useref#returns) from the same `useRef` call on every render. It never changes, so it will never by itself cause the effect to re-run. Therefore, it does not matter whether you include it or not. Including it is fine too:

```js {9}
function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);
  useEffect(() => {
    if (isPlaying) {
      ref.current.play();
    } else {
      ref.current.pause();
    }
  }, [isPlaying, ref]);
```

The [`set` functions](/apis/usestate#setstate) returned by `useState` also have stable identity, so you will often see them omitted from the dependencies too. If the linter lets you omit a dependency without errors, it is safe to do.

Omitting always-stable dependencies only works when the linter can "see" that the object is stable. For example, if `ref` was passed from a parent component, you would have to specify it in the dependency array. However, this is good because you can't know whether the parent component always passes the same ref, or passes one of several refs conditionally. So your effect _would_ depend on which ref is passed.

</DeepDive>

### Step 3: Add cleanup if needed {/*step-3-add-cleanup-if-needed*/}

Consider a different example. You're writing a `ChatRoom` component that needs to connect to the chat server when it appears. You are given a `createConnection()` API that returns an object with `connect()` and `disconnect()` methods. How do you keep the component connected while it is displayed to the user?

Start by writing the effect logic:

```js
useEffect(() => {
  const connection = createConnection();
  connection.connect();
});
```

It would be slow to connect to the chat after every re-render, so you add the dependency array:

```js {4}
useEffect(() => {
  const connection = createConnection();
  connection.connect();
}, []);
```

**The code inside the effect does not use any props or state, so your dependency array is `[]` (empty). This tells React to only run this code when the component "mounts," i.e. appears on the screen for the first time.**

Let's try running this code:

<Sandpack>

```js
import { useState, useEffect } from 'react';
import { createConnection } from './chat.js';

export default function ChatRoom() {
  useEffect(() => {
    const connection = createConnection();
    connection.connect();
  }, []);
  return <h1>Welcome to the chat!</h1>;
}
```

```js chat.js
export function createConnection() {
  // A real implementation would actually connect to the server
  return {
    connect() {
      console.log('Connecting...');
    },
    disconnect() {
      console.log('Disconnected.');
    }
  };
}
```

```css
input { display: block; margin-bottom: 20px; }
```

</Sandpack>

This effect only runs on mount, so you might expect `"Connecting..."` to be printed once in the console. **However, if you check the console, `"Connecting..."` gets printed twice. Why does it happen?**

Imagine the `ChatRoom` component is a part of a larger app with many different screens. The user starts their journey on the `ChatRoom` page. The component mounts and calls `connection.connect()`. Then imagine the user navigates to another screen--for example, to the Settings page. The `ChatRoom` component unmounts. Finally, the user clicks Back and `ChatRoom` mounts again. This would set up a second connection--but the first connection was never destroyed! As the user navigates across the app, the connections would keep piling up.

Bugs like this are easy to miss without extensive manual testing. To help you spot them quickly, in development React remounts every component once immediately after its initial mount. **Seeing the `"Connecting..."` log twice helps you notice the real issue: your code doesn't close the connection when the component unmounts.**

To fix the issue, return a *cleanup function* from your effect:

```js {4-6}
  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    return () => {
      connection.disconnect();
    };
  }, []);
```

React will call your cleanup function each time before the effect runs again, and one final time when the component unmounts (gets removed). Let's see what happens when the cleanup function is implemented:

<Sandpack>

```js
import { useState, useEffect } from 'react';
import { createConnection } from './chat.js';

export default function ChatRoom() {
  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    return () => connection.disconnect();
  }, []);
  return <h1>Welcome to the chat!</h1>;
}
```

```js chat.js
export function createConnection() {
  // A real implementation would actually connect to the server
  return {
    connect() {
      console.log('Connecting...');
    },
    disconnect() {
      console.log('Disconnected.');
    }
  };
}
```

```css
input { display: block; margin-bottom: 20px; }
```

</Sandpack>

Now you get three console logs in development:

1. `"Connecting..."`
2. `"Disconnected."`
3. `"Connecting..."`

**This is the correct behavior in development.** By remounting your component, React verifies that navigating away and back would not break your code. Disconnecting and then connecting again is exactly what should happen! When you implement the cleanup well, there should be no user-visible difference between running the effect once vs running it, cleaning it up, and running it again. There's an extra connect/disconnect call pair because React is probing your code for bugs in development. This is normal and you shouldn't try to make it go away.

**In production, you would only see `"Connecting..."` printed once.** Remounting components only happens in development to help you find effects that need cleanup. You can turn off [Strict Mode](/apis/strictmode) to opt out of the development behavior, but we recommend keeping it on. This lets you find many bugs like the one above.

## Common cleanup patterns {/*common-cleanup-patterns*/}

The cleanup function should stop or undo whatever the effect was doing. The rule of thumb is that the user shouldn't be able to distinguish between the effect running once and an _effect → cleanup → effect_ sequence.

If your effect subscribes to something, the cleanup function should unsubscribe:

```js {3}
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [handleScroll]);
```

If your effect fetches something, the cleanup function should either [abort the fetch](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) or ignore its result:

```js {2,6,13-15}
useEffect(() => {
  let ignore = false;

  async function startFetching() {
    const user = await fetchUser(userId);
    if (!ignore) {
      setResult(user);
    }
  }

  startFetching();

  return () => {
    ignore = true;
  };
}, [userId]);
```

You can't "undo" a network request that already happened, but your cleanup function should ensure that the fetch that's _not relevant anymore_ does not keep affecting your application. For example, if the `userId` changes from `'Alice'` to `'Bob'`, cleanup ensures that the `'Alice'` response is ignored even if it arrives after `'Bob'`.

<DeepDive title="What are good alternatives to data fetching in effects?">

Writing `fetch` calls inside effects is a [popular way to fetch data](https://www.robinwieruch.de/react-hooks-fetch-data/), especially in fully client-side apps. This is, however, a very manual approach and it has significant downsides:

- **Effects don't run on the server.** This means that the initial server-rendered HTML will only include a loading state with no data. The client computer will have to download all JavaScript and render your app only to discover that now it needs to load the data. This is not very efficient.
- **Fetching directly in effects makes it easy to create "network waterfalls".** You render the parent component, it fetches some data, renders the child components, and then they start fetching their data. If the network is not very fast, this is significantly slower than fetching all data in parallel.
- **Fetching directly in effects usually means you don't preload or cache data.** For example, if the component unmounts and then mounts again, it would have to fetch the data again.
- **It's not very ergonomic.** There's quite a bit of boilerplate code involved when writing `fetch` calls in a way that doesn't suffer from bugs like [race conditions](https://maxrozen.com/race-conditions-fetching-data-react-with-useeffect).

This list of downsides is not specific to React. It applies to fetching data on mount with any library. Like with routing, data fetching is not trivial to do well, so we recommend the following approaches:

- **If you use a [framework](/learn/start-a-new-react-project#building-with-a-full-featured-framework), use its built-in data fetching mechanism.** Modern React frameworks have integrated data fetching mechanisms that are efficient and don't suffer from the above pitfalls.
- **Otherwise, consider using or building a client-side cache.** Popular open source solutions include [React Query](https://react-query.tanstack.com/), [useSWR](https://swr.vercel.app/), and [React Router 6.4+](https://beta.reactrouter.com/en/remixing/getting-started/data). You can build your own solution too, in which case you would use effects under the hood but also add logic for deduplicating requests, caching responses, and avoiding network waterfalls (by preloading data or hoisting data requirements to routes).

You can continue fetching data directly in effects if neither of these approaches suit you.

</DeepDive>

## Putting it all together {/*putting-it-all-together*/}

You can think of `useEffect` as "attaching" a piece of behavior to the render output. Consider this effect:

```js
export default function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);

  return <h1>Welcome to {roomId}!</h1>;
}
```

Let's see what exactly happens as the user navigates around the app.

### Initial render {/*initial-render*/}

The user visits `<ChatRoom roomId="general" />`. Let's [mentally substitute](/learn/state-as-a-snapshot#rendering-takes-a-snapshot-in-time) `roomId` with `'general'`:

```js
  // JSX for the first render (roomId = "general")
  return <h1>Welcome to general!</h1>;
```

**The effect is *also* a part of the rendering output.** The first render's effect becomes:

```js
  // Effect for the first render (roomId = "general")
  () => {
    const connection = createConnection('general');
    connection.connect();
    return () => connection.disconnect();
  },
  // Dependencies for the first render (roomId = "general")
  ['general']
```

React runs this effect, which connects to the `'general'` chat room.

### Re-render with same dependencies {/*re-render-with-same-dependencies*/}

Let's say `<ChatRoom roomId="general" />` re-renders. The JSX output is the same:

```js
  // JSX for the second render (roomId = "general")
  return <h1>Welcome to general!</h1>;
```

React sees that the rendering output has not changed, so it doesn't update the DOM.

The effect from the second render looks like this:

```js
  // Effect for the second render (roomId = "general")
  () => {
    const connection = createConnection('general');
    connection.connect();
    return () => connection.disconnect();
  },
  // Dependencies for the second render (roomId = "general")
  ['general']
```

React compares `['general']` from the second render with `['general']` from the first render. **Because all dependencies are the same, React *ignores* the effect from the second render.** It never gets called.

### Re-render with different dependencies {/*re-render-with-different-dependencies*/}

Then, the user visits `<ChatRoom roomId="travel" />`. This time, the component returns different JSX:

```js
  // JSX for the third render (roomId = "travel")
  return <h1>Welcome to travel!</h1>;
```

React updates the DOM to change `"Welcome to general"` into `"Welcome to travel"`.

The effect from the third render looks like this:

```js
  // Effect for the third render (roomId = "travel")
  () => {
    const connection = createConnection('travel');
    connection.connect();
    return () => connection.disconnect();
  },
  // Dependencies for the third render (roomId = "travel")
  ['travel']
```

React compares `['travel']` from the third render with `['general']` from the second render. This time, one dependency is different: `Object.is('travel', 'general')` is `false`. The effect can't be skipped.

**Before React can apply the effect from the third render, it needs to clean up the last effect that _did_ run.** Effect from the second render was skipped, so the effect React needs to clean up is from the first render. If you scroll up to the first render, you'll see that its cleanup calls `connection.disconnect()` on the connection that was created with `createConnection('general')`. This disconnects the app from the `'general'` chat room.

After the last effect is cleaned up, React runs the third render's effect. It connects to the `'travel'` chat room.

### Unmount {/*unmount*/}

Finally, let's say the user navigates away, and the `ChatRoom` component unmounts.

React run the last effect's cleanup function. The last effect was from the third render. The third render's cleanup destroys the `createConnection('travel')` connection. So the app disconnects from the `'travel'` room.

### Development-only behaviors {/*development-only-behaviors*/}

When [Strict Mode](/apis/strictmode) is on, React remounts every component once after mount (state and DOM are preserved). This [helps you find effects that need cleanup](#step-3-add-cleanup-if-needed) and exposes bugs like race conditions early. Additionally, React will remount the effects whenever you save a file in development. Both of these behaviors are development-only.

<Recap>

- Unlike events, effects are caused by rendering itself rather than a particular interaction.
- Effects let you synchronize a component with some external system (third-party API, network, etc).
- By default, effects run after every render (including the initial one).
- React will skip the effect if all of its dependencies have the same values as during the last render.
- You can't "choose" your dependencies. They are determined by the code inside the effect.
- An empty dependency array (`[]`) corresponds to the component "mounting", i.e. being added to the screen.
- When Strict Mode is on, React mounts components twice (in development only!) to stress-test your effects.
- If your effect breaks because of remounting, you need to implement a cleanup function.
- React will call your cleanup function before the effect runs next time, and during the unmount.

</Recap>

