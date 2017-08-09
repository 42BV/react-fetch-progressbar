# About

[![Build Status](https://travis-ci.org/42BV/react-fetch-progressbar.svg?branch=master)](https://travis-ci.org/42BV/react-fetch-progressbar)
[![Codecov](https://codecov.io/gh/42BV/react-fetch-progressbar/branch/master/graph/badge.svg)](https://codecov.io/gh/42BV/react-fetch-progressbar)

Show a ProgressBar in React whenever a fetch request is in progress.

# Features

1. Only shows the ProgressBar when requests take more than 150 milliseconds.
   This way users are not looking at a progress bar needlessly.

2. When the requests finishes it will always show a nice 100% complete animation.
   This way users will always see the progress bar complete the animation.

3. The ProgressBar can be styled to your liking.

# Installation

`npm install react-fetch-progressbar --save`

# Usage

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

```js
import { ProgressBar } from 'react-fetch-progressbar';

// Then somewhere in a render method:
<ProgressBar />
```

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

```js
<ProgressBar style={{ backgroundColor: 'red', height: '10px' }}/>
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
