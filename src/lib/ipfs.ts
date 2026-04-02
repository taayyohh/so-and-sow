const GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://plantmaterial.mypinata.cloud';
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_PINATA_GATEWAY_TOKEN || '';

export function ipfsUrl(cidOrUrl: string): string {
  if (!cidOrUrl) return '';
  if (cidOrUrl.startsWith('ipfs://')) {
    const cid = cidOrUrl.replace('ipfs://', '');
    const tokenParam = GATEWAY_TOKEN ? `?pinataGatewayToken=${GATEWAY_TOKEN}` : '';
    return `${GATEWAY_URL}/ipfs/${cid}${tokenParam}`;
  }
  if (cidOrUrl.startsWith('http') && !cidOrUrl.includes('/ipfs/')) return cidOrUrl;
  const cid = cidOrUrl.includes('/ipfs/')
    ? cidOrUrl.split('/ipfs/').pop()!
    : cidOrUrl;
  const tokenParam = GATEWAY_TOKEN ? `?pinataGatewayToken=${GATEWAY_TOKEN}` : '';
  return `${GATEWAY_URL}/ipfs/${cid}${tokenParam}`;
}

export function ipfsPublicUrl(cidOrUrl: string): string {
  if (!cidOrUrl) return '';
  if (cidOrUrl.startsWith('ipfs://')) {
    const cid = cidOrUrl.replace('ipfs://', '');
    return `${GATEWAY_URL}/ipfs/${cid}`;
  }
  if (cidOrUrl.startsWith('http') && !cidOrUrl.includes('/ipfs/')) return cidOrUrl;
  const cid = cidOrUrl.includes('/ipfs/')
    ? cidOrUrl.split('/ipfs/').pop()!
    : cidOrUrl;
  return `${GATEWAY_URL}/ipfs/${cid}`;
}
