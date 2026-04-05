import { useEffect } from 'react';

interface JsonLdScriptProps {
  data: Record<string, any>;
}

export function JsonLdScript({ data }: JsonLdScriptProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.id = 'json-ld-script';

    // Falls bereits ein Script existiert, entfernen wir es vorher
    const existingScript = document.getElementById('json-ld-script');
    if (existingScript) {
      document.head.removeChild(existingScript);
    }

    document.head.appendChild(script);

    return () => {
      const currentScript = document.getElementById('json-ld-script');
      if (currentScript) {
        document.head.removeChild(currentScript);
      }
    };
  }, [data]);

  return null;
}