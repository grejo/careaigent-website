import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { crc32, maakZip, uniekeNamen } from '../zip';

describe('zip', () => {
  it('berekent de standaard CRC-32', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('maakt unieke, veilige bestandsnamen', () => {
    expect(uniekeNamen(['a.pdf', 'A.pdf', 'b/c.pdf', 'a.pdf'])).toEqual(['a.pdf', 'A (2).pdf', 'b_c.pdf', 'a (3).pdf']);
  });

  it('geeft een geldige zip die unzip kan uitpakken', () => {
    const bestanden = [
      { naam: 'Slides é.pdf', data: new TextEncoder().encode('%PDF-1.4 slides') },
      { naam: 'Links.txt', data: new TextEncoder().encode('Opname: https://example.com') },
    ];
    const map = mkdtempSync(join(tmpdir(), 'zip-'));
    writeFileSync(join(map, 'test.zip'), maakZip(bestanden));
    execFileSync('unzip', ['-t', '-q', 'test.zip'], { cwd: map });
    // Python volgt de zip-standaard (UTF-8-vlag) en controleert de CRC per bestand.
    const inhoud = JSON.parse(
      execFileSync('python3', [
        '-c',
        'import zipfile,json;z=zipfile.ZipFile("test.zip");assert z.testzip() is None;print(json.dumps({n:z.read(n).decode() for n in z.namelist()}))',
      ], { cwd: map }).toString(),
    );
    expect(inhoud).toEqual({ 'Slides é.pdf': '%PDF-1.4 slides', 'Links.txt': 'Opname: https://example.com' });
  });
});
