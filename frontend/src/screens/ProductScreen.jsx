import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Row,
  Col,
  Image,
  ListGroup,
  Card,
  Button,
  Form,
  ListGroupItem,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Rating from "../components/Rating";
import {
  useGetProductDetailsQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useUpdateReviewMutation,
} from "../slices/productsApiSlice";
import Loader from "../components/Loader";
import Message from "../components/Message";
import { addToCart } from "../slices/cartSlice";
import { toast } from "react-toastify";
import { FaTrash, FaEdit } from "react-icons/fa";

const ProductScreen = () => {
  const { id: product_id } = useParams();

  const [updateReview] = useUpdateReviewMutation();
  // console.log(product_id);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editedComment, setEditedComment] = useState("");
  const [editedRating, setEditedRating] = useState(0);

  const handleEdit = (review) => {
    setEditingReviewId(review.review_id);
    setEditedComment(review.comment);
    setEditedRating(review.rating);
  };

  const handleCancel = () => {
    setEditingReviewId(null);
    setEditedComment("");
    setEditedRating(0);
  };

  const handleSave = async (review_id) => {
    try {
      await updateReview({
        review_id,
        comment: editedComment,
        rating: editedRating,
      }).unwrap();
      refetch(); // osveži review-e nakon promene
      setEditingReviewId(null);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const [deleteReview] = useDeleteReviewMutation();

  const handleDelete = async (review_id) => {
    if (window.confirm("Are you sure")) {
      try {
        await deleteReview(review_id);
        toast.success("Review deleted");
        refetch();
      } catch (error) {
        toast.error(error?.data?.message || error.error);
      }
    }
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const {
    data: product,
    isLoading,
    refetch,
    error,
  } = useGetProductDetailsQuery(product_id);

  // console.log(product);

  const [createReview, { isLoading: loadingProductReview }] =
    useCreateReviewMutation();

  const { userInfo } = useSelector((state) => state.auth);
  console.log(userInfo);
  const user_id = userInfo.user_id;

  const addToCartHandler = () => {
    dispatch(addToCart({ ...product, qty }));
    navigate("/cart");
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      await createReview({
        product_id,
        rating,
        comment,
      }).unwrap(); //mutation vraća promise, pa isti moramo da raspakujemo sa unwrap() kako bi dobili raw data
      refetch();
      toast.success("Review created successfully");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <>
      <Link className="btn btn-light my-3" to="/">
        Go Back
      </Link>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          <Row>
            <Col md={5}>
              <Image src={product.image} alt={product.name} fluid />
            </Col>

            <Col md={4}>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <h3>{product.name}</h3>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Rating
                    value={product.rating}
                    text={`${product.num_reviews} reviews`}
                  />
                </ListGroup.Item>
                <ListGroup.Item>Price: ${product.price}</ListGroup.Item>
                <ListGroup.Item>
                  Description: {product.description}
                </ListGroup.Item>
              </ListGroup>
            </Col>

            <Col md={3}>
              <Card>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <Row>
                      <Col>Price:</Col>
                      <Col>
                        <strong>${product.price}</strong>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Row>
                      <Col>Status:</Col>
                      <Col>
                        <strong>
                          {product.count_in_stock > 0
                            ? "In Stock"
                            : "Out Of Stock"}
                        </strong>
                      </Col>
                    </Row>
                  </ListGroup.Item>

                  {product.count_in_stock > 0 && (
                    <ListGroup.Item>
                      <Row>
                        <Col>Qty</Col>
                        <Col>
                          <Form.Control
                            as="select"
                            value={qty}
                            onChange={(e) => setQty(Number(e.target.value))}
                          >
                            {[...Array(product.count_in_stock).keys()].map(
                              (x) => (
                                <option key={x + 1} value={x + 1}>
                                  {x + 1}
                                </option>
                              )
                            )}
                          </Form.Control>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  )}

                  <ListGroupItem>
                    <Button
                      className="btn-block"
                      type="button"
                      disabled={product.count_in_stock === 0}
                      onClick={addToCartHandler}
                    >
                      Add To Cart
                    </Button>
                  </ListGroupItem>
                </ListGroup>
              </Card>
            </Col>
          </Row>
          <Row className="review">
            <Col md={6}>
              <h2>Reviews</h2>
              {product.reviews.length === 0 && <Message>No Reviews</Message>}
              <ListGroup variant="flush">
                {product.reviews.map((review) => (
                  <ListGroup.Item key={review.review_id}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{review.user_name}</strong>

                        {editingReviewId === review.review_id ? (
                          <>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={editedComment}
                              onChange={(e) => setEditedComment(e.target.value)}
                              className="my-1"
                            />
                            <Form.Control
                              as="select"
                              value={editedRating}
                              onChange={(e) =>
                                setEditedRating(Number(e.target.value))
                              }
                              className="my-1"
                            >
                              <option value={1}>1 - Poor</option>
                              <option value={2}>2 - Fair</option>
                              <option value={3}>3 - Good</option>
                              <option value={4}>4 - Very Good</option>
                              <option value={5}>5 - Excellent</option>
                            </Form.Control>
                          </>
                        ) : (
                          <>
                            <Rating value={review.rating} />
                            <p>{review.created_at.substring(0, 10)}</p>
                            <p>{review.comment}</p>
                          </>
                        )}
                      </div>

                      {review.user_id === user_id && (
                        <div className="d-flex gap-2">
                          {editingReviewId === review.review_id ? (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleSave(review.review_id)}
                              >
                                Save
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleCancel}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <FaEdit
                                style={{ cursor: "pointer" }}
                                onClick={() => handleEdit(review)}
                              />
                              <FaTrash
                                style={{ color: "red", cursor: "pointer" }}
                                onClick={() => handleDelete(review.review_id)}
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
                <ListGroup.Item>
                  <h2>Write a Customer Review</h2>
                  {loadingProductReview && <Loader />}
                  {userInfo ? (
                    <Form onSubmit={submitHandler}>
                      <Form.Group className="my-2" controlId="rating">
                        <Form.Label>Rating</Form.Label>
                        <Form.Control
                          as="select"
                          required
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                        >
                          <option value="">Select...</option>
                          <option value="1">1 - Poor</option>
                          <option value="2">2 - Fair</option>
                          <option value="3">3 - Good</option>
                          <option value="4">4 - Very Good</option>
                          <option value="5">5 - Excellent</option>
                        </Form.Control>
                      </Form.Group>
                      <Form.Group className="my-2" controlId="comment">
                        <Form.Label>Comment</Form.Label>
                        <Form.Control
                          as="textarea"
                          row="3"
                          required
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        ></Form.Control>
                      </Form.Group>
                      <Button
                        disabled={loadingProductReview}
                        type="submit"
                        variant="primary"
                      >
                        Submit
                      </Button>
                    </Form>
                  ) : (
                    <Message>
                      Please <Link to="/login">sign in</Link> to write a review
                    </Message>
                  )}
                </ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
        </>
      )}
    </>
  );
};

export default ProductScreen;
