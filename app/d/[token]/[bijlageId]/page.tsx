import type { Metadata } from 'next';
import { vindDownload } from '@/lib/download';
import DownloadStarter from './DownloadStarter';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Download', robots: { index: false, follow: false } };

export default async function DownloadPage({ params }: { params: Promise<{ token: string; bijlageId: string }> }) {
  const { token, bijlageId } = await params;
  const gevonden = await vindDownload(token, bijlageId);

  return (
    <div className="eval-page">
      <div className="eval-wrap">
        <div className="eval-card">
          <div className="eval-kop">
            <div className="eval-eyebrow">CareAIgent · Download</div>
            {gevonden ? (
              <>
                <h1>{gevonden.bijlage.titel}</h1>
                <DownloadStarter token={token} bijlageId={bijlageId} isLink={gevonden.bijlage.soort === 'LINK'} />
              </>
            ) : (
              <>
                <h1>Link niet gevonden</h1>
                <p>Deze downloadlink is ongeldig of niet meer beschikbaar. Mail naar joachim.gregoor@pxl.be als je het document nog nodig hebt.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
