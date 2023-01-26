import NodeCache from 'node-cache';
import { useAdapter } from '@type-cacheable/node-cache-adapter';

export const SOURCES_ID = "1v-otrlXBw7hD0u7xDF7uTOl6EK0K4ycZQMRvlJBmi3o";

const client = new NodeCache();
const clientAdapter = useAdapter(client);