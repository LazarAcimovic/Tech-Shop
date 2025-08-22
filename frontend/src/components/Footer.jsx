import { Container, Row, Col, Form, Button } from "react-bootstrap";
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-info text-light mt-5">
      <Container className="py-5">
        <Row>
          <Col md={4} className="mb-4">
            <h4>Fusion Tech</h4>
            <p>
              We tend to offer the best e-commerce quality in the region. Be
              free to take a look to our newly created web shop which offers
              high quality products.
            </p>
          </Col>

          <Col md={4} className="mb-4">
            <h5>Kontakt</h5>
            <p>Email: info@fusiontech.com</p>
            <p>Telefon: +381 555 333</p>
            <p>Adresa: Novi Sad, Srbija</p>
          </Col>

          <Col md={4}>
            <h5>Pošaljite poruku</h5>
            <Form>
              <Form.Group controlId="formName" className="mb-3">
                <Form.Control type="text" placeholder="Vaše ime" required />
              </Form.Group>
              <Form.Group controlId="formEmail" className="mb-3">
                <Form.Control type="email" placeholder="Vaš email" required />
              </Form.Group>
              <Form.Group controlId="formMessage" className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Poruka"
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                Pošalji
              </Button>
            </Form>
          </Col>
        </Row>

        <hr className="bg-light" />
        <Row>
          <Col className="text-center">
            <p className="mb-0">Fusion Tech &copy; {currentYear}</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
