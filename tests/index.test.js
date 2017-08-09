// @flow

import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import {
  ProgressBar,
  progressBarFetch,
  setActiveRequests,
  activeRequests,
  setOriginalFetch
} from '../src/index';

describe('Component: ProgressBar', () => {
  describe('ui', () => {
    let progressBar;

    function setup({ mode, style }) {
      progressBar = shallow(<ProgressBar style={style} />);
      progressBar.setState({ mode });
    }

    test('mode: inactive', () => {
      setup({ mode: 'inactive', style: undefined });

      expect(toJson(progressBar)).toMatchSnapshot();
    });

    test('mode: active', () => {
      setup({ mode: 'active', style: undefined });

      expect(toJson(progressBar)).toMatchSnapshot();
    });

    test('mode: complete', () => {
      setup({ mode: 'complete', style: undefined });

      expect(toJson(progressBar)).toMatchSnapshot();
    });

    test('custom style', () => {
      setup({
        mode: 'active',
        style: { backgroundColor: 'red', height: '10px', left: '10px' }
      });

      expect(toJson(progressBar)).toMatchSnapshot();
    });
  });

  describe('lifecycle methods', () => {
    test('componentDidMount', () => {
      const progressBar = new ProgressBar();

      jest.spyOn(progressBar, 'tick').mockReturnValue(42);

      progressBar.componentDidMount();

      expect(progressBar.tick).toHaveBeenCalledTimes(1);
    });

    test('shouldComponentUpdate', () => {
      const progressBar = new ProgressBar({ color: 'orange' });

      expect(
        progressBar.shouldComponentUpdate(
          { color: 'blue' },
          { mode: 'inactive' }
        )
      ).toBe(false);

      expect(
        progressBar.shouldComponentUpdate(
          { color: 'orange' },
          { mode: 'active' }
        )
      ).toBe(true);
    });
  });

  describe('tick', () => {
    beforeEach(() => {
      jest.useFakeTimers();

      setActiveRequests(0);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('mode: inactive', () => {
      it('should move to "active" when there are pending request, and after 100 milliseconds there are still pending requests', () => {
        const progressBar = shallow(<ProgressBar />);

        setActiveRequests(1);
        progressBar.setState({ mode: 'inactive' });

        // $FlowFixMe
        progressBar.instance().tick();

        jest.runTimersToTime(99);
        expect(progressBar.state().mode).toBe('inactive');

        jest.runTimersToTime(100);
        expect(progressBar.state().mode).toBe('active');
      });

      it('should stay "inactive" when there are pending request, but after 150 milliseconds no pending requests anymore', () => {
        const progressBar = shallow(<ProgressBar />);

        setActiveRequests(1);
        progressBar.setState({ mode: 'inactive' });

        // $FlowFixMe
        progressBar.instance().tick();

        jest.runTimersToTime(99);
        expect(progressBar.state().mode).toBe('inactive');

        setActiveRequests(0);

        jest.runTimersToTime(100);
        expect(progressBar.state().mode).toBe('inactive');
      });

      it('should stay "inactive" when there are no pending requests', () => {
        const progressBar = shallow(<ProgressBar />);

        setActiveRequests(0);
        progressBar.setState({ mode: 'inactive' });

        // $FlowFixMe
        progressBar.instance().tick();

        jest.runTimersToTime(50);

        expect(progressBar.state().mode).toBe('inactive');
      });
    });

    describe('mode: active', () => {
      it('should move to "complete" when there are no pending request, and after 200 milliseconds there are still no pending requests', () => {
        const progressBar = shallow(<ProgressBar />);

        setActiveRequests(0);
        progressBar.setState({ mode: 'active' });

        // $FlowFixMe
        progressBar.instance().tick();

        jest.runTimersToTime(199);
        expect(progressBar.state().mode).toBe('active');

        jest.runTimersToTime(200);
        expect(progressBar.state().mode).toBe('complete');
      });

      it('should stay "active" when there are no pending request at first, but after 200 milliseconds there are new pending requests', () => {
        const progressBar = shallow(<ProgressBar />);

        setActiveRequests(0);
        progressBar.setState({ mode: 'active' });

        // $FlowFixMe
        progressBar.instance().tick();

        jest.runTimersToTime(199);
        expect(progressBar.state().mode).toBe('active');

        setActiveRequests(1);

        jest.runTimersToTime(200);
        expect(progressBar.state().mode).toBe('active');
      });

      it('should stay "active" when there are pending requests', () => {
        const progressBar = shallow(<ProgressBar />);

        setActiveRequests(1);
        progressBar.setState({ mode: 'active' });

        // $FlowFixMe
        progressBar.instance().tick();

        jest.runTimersToTime(50);

        expect(progressBar.state().mode).toBe('active');
      });
    });

    describe('mode: complete', () => {
      it('should move to "inactive" after 1000 milliseconds to allow the animation to complete', () => {
        const progressBar = shallow(<ProgressBar />);
        progressBar.setState({ mode: 'complete' });

        // $FlowFixMe
        progressBar.instance().tick();

        jest.runTimersToTime(999);

        expect(progressBar.state().mode).toBe('complete');

        jest.runTimersToTime(1000);

        expect(progressBar.state().mode).toBe('inactive');
      });
    });
  });
});

describe('progressBarFetch', () => {
  let fetch;

  beforeEach(() => {
    fetch = jest.fn();

    setOriginalFetch(fetch);
    setActiveRequests(0);
  });

  it('should increase "activeRequests" when making a request and decrease on success', done => {
    let resolve;
    const promise = new Promise((res, rej) => {
      resolve = res;
    });

    fetch.mockReturnValue(promise);

    expect(activeRequests).toBe(0);

    progressBarFetch('/hello-world');

    expect(activeRequests).toBe(1);

    // $FlowFixMe
    resolve({ status: 200 });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/hello-world', undefined);

    promise.then(response => {
      expect(response.status).toBe(200);

      expect(activeRequests).toBe(0);
      done();
    });
  });

  it('should increase "activeRequests" when making a request and decrease on failure', done => {
    let reject;
    const promise = new Promise((res, rej) => {
      reject = rej;
    });

    fetch.mockReturnValue(promise);

    expect(activeRequests).toBe(0);

    progressBarFetch('/goodbye-world', { method: 'POST' });

    expect(activeRequests).toBe(1);

    // $FlowFixMe
    reject({ status: 500 });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/goodbye-world', { method: 'POST' });

    promise.catch(error => {
      expect(error.status).toBe(500);

      setTimeout(() => {
        expect(activeRequests).toBe(0);
        done();
      }, 10);
    });
  });
});
