const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../index");

//Assertion Style
chai.should();

chai.use(chaiHttp);

// describe("User Api", () => {
//   //Before each test we empty the database
//   beforeEach((done)=>{
//     User.remove({},()=>{})
//   })
//   //Test register route;
//   if("It should Register new user", (done)=>{
//     chai.request(server).post("/api/users/register").end((err,response)=>{
//       response.should.have.status(200);
//       response.should.be.an("object");
//       response.should.equal("");
//       response.should.have.lengthOf("");
//     })
//   })
//   //Test login route;
//   //Test logout route
// });
