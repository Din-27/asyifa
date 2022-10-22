import { Nullable } from "@/common/utils/Nullable";
import { Enforcer, newEnforcer } from "casbin";
import { autoInjectable, singleton } from "tsyringe";
import { CasbinAdapter } from "./adapter";

@singleton()
@autoInjectable()
export class CasbinEnforcer {
  private instance: Nullable<Enforcer>;

  constructor(private adapter: CasbinAdapter) {
    this.instance = null;
  }

  public async getEnforcer(): Promise<Enforcer> {
    if (!this.instance) {
      this.instance = await newEnforcer("config/casbin/model.conf", this.adapter);
      this.instance.loadPolicy();
    }
    return this.instance;
  }
}
