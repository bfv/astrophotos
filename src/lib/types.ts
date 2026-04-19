export interface PhotoMetadata {
  date?: string;
  equipment?: string;
  exposure?: string;
  [key: string]: string | undefined;
}

export interface Photo {
  id: string;
  name: string;
  ra: number;
  dec: number;
  fov?: number;
  rotation?: number;
  thumbnail?: string | null;
  fullSizeUrl?: string | null;
  metadata?: PhotoMetadata;
}
