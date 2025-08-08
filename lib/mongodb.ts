import { MongoClient } from "mongodb"

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

export async function getMongoClient() {
  const uri = process.env.MONGODB_URI
  if (!uri) return null
  if (!clientPromise) {
    client = new MongoClient(uri)
    clientPromise = client.connect()
  }
  return clientPromise
}
