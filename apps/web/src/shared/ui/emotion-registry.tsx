"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { useState, type ReactNode } from "react";

export function EmotionRegistry({ children }: { children: ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "web" });
    // 서버에서 스타일 문자열을 수집해 초기 HTML에 삽입한다.
    cache.compat = true;
    const originalInsert = cache.insert;
    let pending: string[] = [];

    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        pending.push(serialized.name);
      }
      return originalInsert(...args);
    };

    return {
      cache,
      flush: () => {
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

    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
