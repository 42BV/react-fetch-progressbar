// @flow

import React, { Component } from 'react';

// Keeps track of how many requests are currently active.
export let activeRequests = 0;

/* 
  Store a reference to the ProgressBar so 'progressBarFetch' can
  move the ProgressBar to the 'init' state.
*/
export let progressBar: ProgressBar;

/*
  The modes form a state machine with the following flow

  init -----> active -> complete --
  ^  \                            |
  |   \----\                      |
  |         \                     |
  |          \                    |
  |           ▾                   | 
  ---------  hibernate <-----------

  hibernate: no animation is running the bar is invisible
  init: Preparing to potentially show the animation.
  active: the animation is running slowly to 80%
  complete: the animation runs quickly to 100%
*/
type Mode = 'hibernate' | 'init' | 'active' | 'complete';

type Props = {
  style?: Object
};

type State = {
  mode: Mode
};

export class ProgressBar extends Component<Props, State> {
  state = {
    mode: 'hibernate'
  };

  // Set the reference to progressBar
  componentDidMount() {
    progressBar = this;
  }

  // Only render if the mode changes
  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return nextState.mode !== this.state.mode;
  }

  /**
   * The ProgressBar continuously checks the status of how many
   * requests are currently active, and will accordingly move
   * to another state.
   * 
   * @memberof ProgressBar
   */
  tick() {
    const mode = this.state.mode;

    if (mode === 'complete') {
      //console.log('complete: moving to hibernate after 1 second to allow the close animation to complete');
      setTimeout(() => {
        this.setState({ mode: 'hibernate' });
      }, 1000);
    } else if (mode === 'active') {
      if (activeRequests === 0) {
        //console.log('active: there are no more pending request move to complete if there are still no pending requests after 200 milliseconds');
        setTimeout(() => {
          if (activeRequests === 0) {
            //console.log('active: even after 200 milliseconds there are no more pending request, moving to complete');
            this.moveToMode('complete');
          } else {
            //console.log('active: after 200 milliseconds another request was pending instead of going to complete will stay active.');
            this.tick();
          }
        }, 200);
      } else {
        //console.log('active: there are still pending requests staying active');
        this.tickWithDelay();
      }
    } else {
      // mode === 'init'
      if (activeRequests > 0) {
        //console.log('init: there are pending request move to active if there are still pending requests after 100 milliseconds');
        setTimeout(() => {
          if (activeRequests > 0) {
            //console.log('init: even after 100 milliseconds there are pending request, moving to active to trigger animation');
            this.moveToMode('active');
          } else {
            //console.log('init: after 100 milliseconds there were no pending request, the requests was so fast that showing an animation is unnecessary, move to hibernate');
            this.setState({ mode: 'hibernate'});
          }
        }, 100);
      } else {
        //console.log('init: no pending requests move to hibernate');
        this.setState({ mode: 'hibernate'});
      }
    }
  }

  moveToInit() {
    if (this.state.mode === 'hibernate') {
      this.moveToMode('init');
    }
  }

  moveToMode(mode: Mode) {
    this.setState({ mode }, () => {
      this.tick();
    });
  }

  tickWithDelay() {
    setTimeout(() => {
      this.tick();
    }, 50);
  }

  render() {
    const mode = this.state.mode;

    if (mode === 'hibernate') {
      return null;
    }

    const width = mode === 'complete' ? 100 : mode === 'init' ? 0 : 80;
    const animationSpeed = mode === 'complete' ? 0.8 : 30;
    const transition =
      mode === 'init' ? '' : `width ${animationSpeed}s ease-in`;

    const style = {
      position: 'absolute',
      top: '0',
      zIndex: '9000',
      backgroundColor: '#f0ad4e',
      height: '4px',
      transition,
      width: `${width}%`,
      ...this.props.style
    };

    return <div className="react-fetch-progress-bar" style={style} />;
  }
}

type FetchSignature = (
  url: string,
  options?: RequestOptions
) => Promise<Response>;

// We store the fetch here as provided by the user.
let originalFetch: FetchSignature;

export function setOriginalFetch(nextOriginalFetch: FetchSignature) {
  originalFetch = nextOriginalFetch;
}

/**
 * Wrapper around fetch: https://developer.mozilla.org/en/docs/Web/API/Fetch_API
 * 
 * It is used to monitor the number of requests which are currently
 * active. Each time a requests is made it increases the number of
 * requests, each time a request is finished, the number is decreased.
 * 
 * @export
 * @param {string} url The url you want to send a request to.
 * @param {RequestOptions} [options] The options you want to pass for that request
 * @returns {Promise<Response>} A Promise which returns a Response 
 */
export function progressBarFetch(
  url: string,
  options?: RequestOptions
): Promise<Response> {
  activeRequests += 1;

  if (progressBar) {
    progressBar.moveToInit();
  }

  return originalFetch(url, options)
    .then(response => {
      activeRequests -= 1;
      return response;
    })
    .catch(error => {
      activeRequests -= 1;
      return Promise.reject(error);
    });
}

/**
 * Sets the number of activeRequests manually.
 * 
 * This method exists for testing purposes, so you should not
 * use it.
 * 
 * @export
 * @param {number} nextActiveRequest 
 */
export function setActiveRequests(nextActiveRequest: number) {
  activeRequests = nextActiveRequest;
}
