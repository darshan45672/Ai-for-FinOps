import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseClientService } from './database-client.service';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [DatabaseClientService],
  exports: [DatabaseClientService],
})
export class DatabaseClientModule {}
