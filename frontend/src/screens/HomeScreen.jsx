import { Row, Col, Form } from "react-bootstrap";
import Product from "../components/Product";
import Loader from "../components/Loader";
import Message from "../components/Message";
import { useGetProductsQuery } from "../slices/productsApiSlice";
import { useParams, Link } from "react-router-dom";
import Paginate from "../components/Paginate";
import { useState, useEffect } from "react";

const HomeScreen = () => {
  const { pageNumber, keyword } = useParams();
  const { data, isLoading, error } = useGetProductsQuery({
    keyword,
    pageNumber,
  });

  const [sortedProducts, setSortedProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState(""); // "", "asc", "desc"

  useEffect(() => {
    if (data?.products) {
      let sorted = [...data.products];
      if (sortOrder === "asc") {
        sorted.sort((a, b) => a.price - b.price);
      } else if (sortOrder === "desc") {
        sorted.sort((a, b) => b.price - a.price);
      }
      setSortedProducts(sorted);
    }
  }, [data, sortOrder]);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          <div className="d-flex align-items-center mb-4">
            <Link to="/" className="btn btn-light me-3">
              Go back
            </Link>

            {/* Dropdown za sortiranje */}
            <Form.Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ maxWidth: "150px" }}
            >
              <option value="">Sort by price...</option>
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </Form.Select>
          </div>

          <h1>Latest Product</h1>
          <Row>
            {sortedProducts.map((product) => (
              <Col key={product.product_id} sm={12} md={6} lg={4} xl={3}>
                <Product product={product} />
              </Col>
            ))}
          </Row>
          <Paginate
            pages={data.pages}
            page={data.page}
            keyword={keyword ? keyword : ""}
          />
        </>
      )}
    </>
  );
};

export default HomeScreen;
