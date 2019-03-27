import React from 'react';
import Enzyme, { shallow, ShallowWrapper } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import toJson from 'enzyme-to-json';

Enzyme.configure({ adapter: new Adapter() });

import {
  ProgressBar,
  progressBarFetch,
  setActiveRequests,
  activeRequests,
  progressBar as progressBarRef,
  setOriginalFetch,
} from '../src/index';

describe('Component: ProgressBar', () => {
  describe('ui', () => {
    let progressBar: ShallowWrapper<ProgressBar, any, any>;

    function setup({ mode, style }: { mode: string; style?: object }): void {
      progressBar = shallow(<ProgressBar style={style} />);
      progressBar.setState({ mode });
    }

    test('mode: hibernate', () => {
      setup({ mode: 'hibernate', style: undefined });

      expect(toJson(progressBar)).toBe('');
    });

    test('mode: init', () => {
      setup({ mode: 'init', style: undefined });

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
        style: { backgroundColor: 'red', height: '10px', left: '10px' },
      });

      expect(toJson(progressBar)).toMatchSnapshot();
    });
  });

  describe('lifecycle methods', () => {
    it('should when componentDidMount set the progressBar reference', () => {
      const progressBar = shallow<ProgressBar>(<ProgressBar />);
      progressBar.instance().componentDidMount();
      expect(progressBarRef).toBe(progressBar.instance());
    });

    it('should when shouldComponentUpdate is called only return true when the mode changes', () => {
      const progressBar = shallow<ProgressBar>(<ProgressBar style={{ color: 'orange' }} />);

      progressBar.setState({ mode: 'complete' });
      const instance = progressBar.instance();

      expect(instance.shouldComponentUpdate({ style: { color: 'blue' } }, { mode: 'complete' })).toBe(false);
      expect(instance.shouldComponentUpdate({ style: { color: 'orange' } }, { mode: 'active' })).toBe(true);
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
        const progressBar = shallow<ProgressBar>(<ProgressBar />);

        setActiveRequests(1);
        progressBar.setState({ mode: 'inactive' });
        progressBar.instance().tick();

        jest.runTimersToTime(99);
        expect(progressBar.state().mode).toBe('inactive');

        jest.runTimersToTime(100);
        expect(progressBar.state().mode).toBe('active');
      });

      it('should move back to "hibernate" when there are pending request, but after 150 milliseconds no pending requests anymore', () => {
        const progressBar = shallow<ProgressBar>(<ProgressBar />);

        setActiveRequests(1);
        progressBar.setState({ mode: 'inactive' });
        progressBar.instance().tick();

        jest.runTimersToTime(99);
        expect(progressBar.state().mode).toBe('inactive');

        setActiveRequests(0);

        jest.runTimersToTime(100);
        expect(progressBar.state().mode).toBe('hibernate');
      });

      it('should move to "hibernate" when there are no pending requests', () => {
        const progressBar = shallow<ProgressBar>(<ProgressBar />);

        setActiveRequests(0);
        progressBar.setState({ mode: 'inactive' });
        progressBar.instance().tick();

        jest.runTimersToTime(50);

        expect(progressBar.state().mode).toBe('hibernate');
      });
    });

    describe('mode: active', () => {
      it('should move to "complete" when there are no pending request, and after 200 milliseconds there are still no pending requests', () => {
        const progressBar = shallow<ProgressBar>(<ProgressBar />);

        setActiveRequests(0);
        progressBar.setState({ mode: 'active' });
        progressBar.instance().tick();

        jest.runTimersToTime(199);
        expect(progressBar.state().mode).toBe('active');

        jest.runTimersToTime(200);
        expect(progressBar.state().mode).toBe('complete');
      });

      it('should stay "active" when there are no pending request at first, but after 200 milliseconds there are new pending requests', () => {
        const progressBar = shallow<ProgressBar>(<ProgressBar />);

        setActiveRequests(0);
        progressBar.setState({ mode: 'active' });
        progressBar.instance().tick();

        jest.runTimersToTime(199);
        expect(progressBar.state().mode).toBe('active');

        setActiveRequests(1);

        jest.runTimersToTime(200);
        expect(progressBar.state().mode).toBe('active');
      });

      it('should stay "active" when there are pending requests', () => {
        const progressBar = shallow<ProgressBar>(<ProgressBar />);

        setActiveRequests(1);
        progressBar.setState({ mode: 'active' });
        progressBar.instance().tick();

        jest.runTimersToTime(50);

        expect(progressBar.state().mode).toBe('active');
      });
    });

    describe('mode: complete', () => {
      it('should move to "hibernate" after 1000 milliseconds to allow the animation to complete', () => {
        const progressBar = shallow<ProgressBar>(<ProgressBar />);
        progressBar.setState({ mode: 'complete' });
        progressBar.instance().tick();

        jest.runTimersToTime(999);

        expect(progressBar.state().mode).toBe('complete');

        jest.runTimersToTime(1000);

        expect(progressBar.state().mode).toBe('hibernate');
      });
    });
  });

  describe('moveToInit', () => {
    it('should move to "init" when mode is "hibernate"', () => {
      const progressBar = shallow<ProgressBar>(<ProgressBar />);

      spyOn(progressBar.instance(), 'moveToMode');

      progressBar.setState({ mode: 'hibernate' });
      progressBar.instance().moveToInit();

      expect(progressBar.instance().moveToMode).toHaveBeenCalledTimes(1);
      expect(progressBar.instance().moveToMode).toHaveBeenCalledWith('init');
    });

    it('should not move to "init" when mode is another mode', () => {
      const progressBar = shallow<ProgressBar>(<ProgressBar />);

      spyOn(progressBar.instance(), 'moveToMode');

      progressBar.setState({ mode: 'active' });
      progressBar.instance().moveToInit();

      expect(progressBar.instance().moveToMode).toHaveBeenCalledTimes(0);
    });
  });
});

describe('progressBarFetch', () => {
  let fakeFetch: jest.Mock<any, any>;

  beforeEach(() => {
    fakeFetch = jest.fn();

    const progressBar = shallow<ProgressBar>(<ProgressBar />);
    progressBar.instance().componentDidMount();

    spyOn(progressBarRef, 'moveToInit');

    // @ts-ignore
    setOriginalFetch(fakeFetch);
    setActiveRequests(0);
  });

  it('should increase "activeRequests" when making a request and decrease on success, and init the progressBar', () => {
    fakeFetch.mockReturnValue(Promise.resolve({ status: 200 }));
    expect(activeRequests).toBe(0);

    const result = progressBarFetch('/hello-world');

    expect(activeRequests).toBe(1);
    expect(progressBarRef.moveToInit).toHaveBeenCalledTimes(1);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    expect(fakeFetch).toHaveBeenCalledWith('/hello-world', undefined);

    result.then(({ status }) => {
      expect(status).toBe(200);
      expect(activeRequests).toBe(0);
    });
  });

  it('should increase "activeRequests" when making a request and decrease on failure, and init the progressBar', () => {
    fakeFetch.mockReturnValue(Promise.reject({ status: 500 }));
    expect(activeRequests).toBe(0);

    const result = progressBarFetch('/goodbye-world', { method: 'POST' });

    expect(activeRequests).toBe(1);
    expect(progressBarRef.moveToInit).toHaveBeenCalledTimes(1);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    expect(fakeFetch).toHaveBeenCalledWith('/goodbye-world', {
      method: 'POST',
    });

    result.catch(({ status }) => {
      expect(status).toBe(500);

      setTimeout(() => {
        expect(activeRequests).toBe(0);
      }, 10);
    });
  });

  it('should not init the progressBar when the ref is not defined', () => {
    const progressBar = shallow<ProgressBar>(<ProgressBar />);
    const componentDidMount = progressBar.instance().componentDidMount;
    componentDidMount.bind(undefined)();

    fakeFetch.mockReturnValue(Promise.resolve());
    progressBarFetch('/goodbye-world', { method: 'POST' });

    expect(progressBarRef).toBe(undefined);
  });
});
