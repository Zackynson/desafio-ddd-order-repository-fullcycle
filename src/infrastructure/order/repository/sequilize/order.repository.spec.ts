import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";


describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  const makeProduct = () => new Product("123", "Product 1", 10);
  const makeOrder = (orderItems: OrderItem[]) => new Order("123", "123", [...orderItems]);

  const setupOrder = (_product?:Product, orderId?:string) => {

    const product = _product || makeProduct()

    const orderItem = new OrderItem(
      orderId ||"1",
      product.name,
      product.price,
      product.id,
      2
    )

    const order = makeOrder([orderItem])

    return {
      orderItem,
      product,
      order
    }
  };



  const setupCustomer = () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");

    customer.changeAddress(address);

    return {
      customerRepository,
      customer,
      address
    }
  }

  it("should update an order", async () => {
    const { customer , customerRepository } = setupCustomer()
    await customerRepository.create(customer);

    const { orderItem, product, order } = setupOrder()

    const productRepository = new ProductRepository();
    const orderRepository = new OrderRepository();

    await productRepository.create(product);
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });

    const orderItem2 = new OrderItem(
      "2",
      product.name,
      product.price,
      product.id,
      2
    )

    order.addItem(orderItem2);

    await orderRepository.update(order)

    const updatedOrderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(updatedOrderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  })

  it("should create a new order", async () => {
    const {
      customer,
      customerRepository
    } = setupCustomer()

    await customerRepository.create(customer);

    const product = makeProduct()
    const { orderItem, order } = setupOrder(product)

    const productRepository = new ProductRepository();
    const orderRepository = new OrderRepository();

    await productRepository.create(product);
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: customer.id,
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: order.id,
          product_id: product.id,
        },
      ],
    });
  });

  it("should find an order by id", async () => {
    const {
      customer,
      customerRepository
    } = setupCustomer()

    await customerRepository.create(customer);

    const product = makeProduct()
    const { orderItem, order } = setupOrder(product)

    const productRepository = new ProductRepository();
    const orderRepository = new OrderRepository();

    await productRepository.create(product);


    await OrderModel.create(
      {
        id: order.id,
        customer_id: order.customerId,
        total: order.total(),
        items: order.items.map((item) => ({
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

    const foundOrder = await orderRepository.find(order.id)

    expect(foundOrder).toStrictEqual({
      id: "123",
      customer_id: customer.id,
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: order.id,
          product_id: product.id,
        },
      ],
    });
  });

  it("should bring an orders list", async () => {
    const {
      customer,
      customerRepository
    } = setupCustomer()

    await customerRepository.create(customer);

    const product1 = new Product('1', 'novo product', 10)
    const product2 = new Product('2', 'novo product', 20)

    const orderItem1 = new OrderItem('orderItem1', 'item 1', 10, product1.id, 10);
    const orderItem2 = new OrderItem('orderItem2', 'item 2', 20, product2.id, 20);

    const order1 = new Order('order1', "123", [orderItem1]);
    const order2 = new Order('order2', "123", [orderItem2]);

    const productRepository = new ProductRepository();
    const orderRepository = new OrderRepository();

    await productRepository.create(product1);
    await productRepository.create(product2);

    await OrderModel.create(
      {
        id: order1.id,
        customer_id: order1.customerId,
        total: order1.total(),
        items: order1.items.map((item) => ({
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

    await OrderModel.create(
      {
        id: order2.id,
        customer_id: order2.customerId,
        total: order2.total(),
        items: order2.items.map((item) => ({
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



    const foundOrders = await orderRepository.findAll()

    expect(foundOrders).toStrictEqual([{
      id: order1.id,
      customer_id: customer.id,
      total: order1.total(),
      items: [
        {
          id: orderItem1.id,
          name: orderItem1.name,
          price: orderItem1.price,
          quantity: orderItem1.quantity,
          order_id: order1.id,
          product_id: product1.id,
        },
      ],
    },
    {
      id: order2.id,
      customer_id: customer.id,
      total: order2.total(),
      items: [
        {
          id: orderItem2.id,
          name: orderItem2.name,
          price: orderItem2.price,
          quantity: orderItem2.quantity,
          order_id: order2.id,
          product_id: product2.id,
        },
      ],
    }]);
  });
});
