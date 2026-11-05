from rest_framework import serializers
from .models import MedicineCategory, Supplier, Medicine, MedicineBatch, PharmacySale, PharmacySaleItem

class MedicineCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineCategory
        fields = '__all__'

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class MedicineBatchSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    strength = serializers.CharField(source='medicine.strength', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = MedicineBatch
        fields = '__all__'

class MedicineSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    batches = MedicineBatchSerializer(many=True, read_only=True)
    total_stock = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = '__all__'

    def get_total_stock(self, obj):
        return sum(b.current_stock for b in obj.batches.all())

class PharmacySaleItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='batch.medicine.name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)

    class Meta:
        model = PharmacySaleItem
        fields = '__all__'
        extra_kwargs = {'sale': {'required': False}}

class PharmacySaleSerializer(serializers.ModelSerializer):
    items = PharmacySaleItemSerializer(many=True, required=False)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = PharmacySale
        fields = '__all__'
        read_only_fields = ['sale_number', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        sale = PharmacySale.objects.create(**validated_data)
        for item_data in items_data:
            item = PharmacySaleItem.objects.create(sale=sale, **item_data)
            # Deduct batch stock
            batch = item.batch
            batch.current_stock = max(0, batch.current_stock - item.quantity)
            batch.save()
        return sale
