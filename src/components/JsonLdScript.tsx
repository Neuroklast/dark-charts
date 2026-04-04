import { useEffect } from 'react';

interface JsonLdScriptProps {
  data: Record<string, any>;
}

export function JsonLdScript({ data }: JsonLdScriptProps) {
  useEffect(() => {
    const scriptId = `json-ld-${data['@type']}-${Date.now()}`;
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [data]);

  return null;
}
