import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "@/modules/user/schema/user.schema";
import { UserController } from "@/modules/user/user.controller";
import { UserService } from "@/modules/user/user.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  exports: [MongooseModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
