import RetellWidget from '@/components/RetellWidget';

interface EmbedPageProps {
  params: {
    widgetId: string;
  };
  searchParams: {
    buttonText?: string;
    theme?: string;
  };
}

export default function EmbedPage({ params, searchParams }: EmbedPageProps) {
  const { widgetId } = params;
  const { buttonText = 'Start Voice Call', theme = 'default' } = searchParams;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Retell Voice Widget</title>
        <style>{`
          body {
            margin: 0;
            padding: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: transparent;
          }
        `}</style>
      </head>
      <body>
        <RetellWidget 
          widgetId={widgetId}
          buttonText={buttonText}
        />
      </body>
    </html>
  );
}