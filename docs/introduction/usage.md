---
layout: default
title: Usage
description: 'Usage instructions for react-fetch-progressbar.'
parent: Introduction
permalink: /usage
nav_order: 3
---

First you must override `window.fetch` with the `progressbarFetch`
so the ProgressBar can knows whenever fetch is called:


```js
import { progressBarFetch, setOriginalFetch } from 'react-fetch-progressbar';

// Let react-fetch-progressbar know what the original fetch is.
setOriginalFetch(window.fetch);

/* 
  Now override the fetch with progressBarFetch, so the ProgressBar
  knows how many requests are currently active.
*/
window.fetch = progressBarFetch;
```

Next you simply display the ProgressBar somewhere:

```jsx
import { ProgressBar } from 'react-fetch-progressbar';

// Then somewhere in a render method:
<ProgressBar />
```

WARNING: only render one ProgressBar at a time, otherwise the two
progressBars will interfere with each other.

# Styling the ProgressBar

You have a two options, either provide a style object or create
a CSS rule.

First these are the default styles, which are applied:

```js
{
  position: 'absolute',
  top: '0',
  zIndex: '9000',
  backgroundColor: '#f0ad4e',
  height: '4px',
}
```

It is important that you never override the `transition` and the
`width` property, otherwise the animation will not work.

## Via style

Say you want a different `height` and `backgroundColor` you simply
override the styles using:

```jsx
const style = {
  backgroundColor: 'red',
  height: '10px'
}

<ProgressBar style={style}/>
```

## Via CSS

The class which is added on the progress bar is called `.react-fetch-progress-bar`
you can extend that class and override properties like so:

```css
.react-fetch-progress-bar {
  backgroundColor: red !important;
  height: 10px;
}
```