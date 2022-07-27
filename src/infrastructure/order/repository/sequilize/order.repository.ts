import { or } from "sequelize/types";
import Order from "../../../../domain/checkout/entity/order";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {

  async update(entity: Order): Promise<void> {
    await OrderModel.update({
      id: entity.id,
      customer_id: entity.customerId,
      total: entity.total(),
      items: entity.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        product_id: item.productId,
        quantity: item.quantity,
      })),
    },
    {
      where: { id: entity.id.toString() }
    })
  }


  async find(id: string): Promise<Order> {
    try {
      const order = await OrderModel.findOne({
        where: { id },
        include: ["items"],
        rejectOnEmpty: true
      });

      return order.toJSON()
    } catch (error) {
      throw new Error("Order not found");
    }
  }

  async findAll(): Promise<Order[]> {
    try {
      const orderModels:OrderModel[] = await OrderModel.findAll(
        {
          include: ["items"],
        }
      );

      return orderModels.map(o =>
        o.toJSON()
      )

    } catch (error) {
      throw new Error("Orders not found");
    }
  }


  async create(entity: Order): Promise<void> {
    try {
      await OrderModel.create(
        {
          id: entity.id,
          customer_id: entity.customerId,
          total: entity.total(),
          items: entity.items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            product_id: item.productId,
            quantity: item.quantity,
          })),
        },
        {
          include: [{ model: OrderItemModel }],
        }
      );
    } catch (error) {
      throw new Error("Error while creating order");
    }
  }
}
