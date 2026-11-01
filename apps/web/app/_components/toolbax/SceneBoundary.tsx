'use client';
import { Component, type ReactNode } from 'react';

/** 3D 오류가 페이지 전체를 중단하지 않도록 격리한다. */
export default class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
