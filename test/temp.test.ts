'use strict';

// const mockS3Client = mockClient(S3Client);

// eslint-disable-next-line no-undef,import/extensions,import/no-unresolved,node/no-missing-import
import {MerossHTTPClient} from "../meross";

// eslint-disable-next-line no-undef
describe('Index', () => {

  it('Test GetSignedUrlPutObject', async () => {
      const merossClient = new MerossHTTPClient('', '')
      const devices = await merossClient.listDevices()
  });
});
