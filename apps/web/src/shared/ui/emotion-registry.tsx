"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { useState, type ReactNode } from "react";

/** 초기 HTML의 스타일과 클라이언트 캐시를 연결해 스타일 누락을 막는다. */
export function EmotionRegistry({ children }: { children: ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "web" });
    // 서버 캐시에 CSS 문자열을 남겨 초기 HTML로 꺼낼 수 있게 한다.
    cache.compat = true;
    const originalInsert = cache.insert;
    let pending: string[] = [];

    cache.insert = (...args) => {
      const serialized = args[1];
      // 같은 규칙이 여러 번 렌더링되어도 스타일 태그에 중복 삽입하지 않는다.
      if (cache.inserted[serialized.name] === undefined) {
        pending.push(serialized.name);
      }
      return originalInsert(...args);
    };

    return {
      cache,
      flush: () => {
        // 여러 번 삽입 훅이 실행되어도 이전 묶음을 재전송하지 않는다.
        const names = pending;
        pending = [];
        return names;
      },
    };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;

    const styles = names
      .map((name) => cache.inserted[name])
      .filter((style): style is string => typeof style === "string")
      .join("");

    // 개발자가 선언한 CSS만 삽입하며 Emotion의 식별자를 함께 전달해 재사용한다.
    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
