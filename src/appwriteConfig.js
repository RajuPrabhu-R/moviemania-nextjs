import { Client, Databases, Account, ID } from 'appwrite'; // ← Account (capital A)

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const databases = new Databases(client);
export const account = new Account(client); // ← Account (capital A), export as lowercase
export { ID };

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const EMBED_LINKS_COLLECTION_ID = 'embed_links';