import unittest
from generar_rutas_producto import routes_for


def product(pid, slug, custom=None, **flags):
    return {'id': pid, 'activo': True, 'slug': slug,
            'product': {'name': 'Producto', 'seo': {'slug': custom}, **flags}}


class ProductRoutesTest(unittest.TestCase):
    def test_custom_and_original_route_resolve_to_same_product(self):
        routes, conflicts = routes_for([product(1, 'producto-1', 'nombre-editado')])
        self.assertEqual(routes, {'producto-1': 1, 'nombre-editado': 1})
        self.assertFalse(conflicts)

    def test_duplicate_custom_slug_does_not_pick_an_arbitrary_product(self):
        routes, conflicts = routes_for([product(1, 'uno-1', 'repetido'), product(2, 'dos-2', 'repetido')])
        self.assertNotIn('repetido', routes)
        self.assertIn('repetido', conflicts)
        self.assertEqual(len(routes), 2)

    def test_custom_slug_cannot_replace_another_products_original_route(self):
        routes, conflicts = routes_for([product(1, 'uno-1', 'dos-2'), product(2, 'dos-2')])
        self.assertEqual(routes['dos-2'], 2)
        self.assertIn('dos-2', conflicts)

    def test_private_products_and_path_traversal_are_not_published(self):
        routes, _ = routes_for([product(1, 'uno-1', '../../admin'), product(2, 'dos-2', __private=True)])
        self.assertEqual(routes, {'uno-1': 1})


if __name__ == '__main__':
    unittest.main()
