<?php

namespace App\Services;

use Kreait\Firebase\Factory;

class FirestoreService
{
    protected $firestore;

    public function __construct()
    {
        $factory = (new Factory())->withServiceAccount(config('firebase.credentials'));
        $this->firestore = $factory->createFirestore()->database();
    }

    public function getCollection(string $collection)
    {
        return $this->firestore->collection($collection)->documents();
    }

    public function getDocument(string $collection, string $documentId)
    {
        return $this->firestore->collection($collection)->document($documentId)->snapshot();
    }

    public function addDocument(string $collection, array $data)
    {
        return $this->firestore->collection($collection)->add($data);
    }

    public function updateDocument(string $collection, string $documentId, array $data)
    {
        return $this->firestore->collection($collection)->document($documentId)->set($data, ['merge' => true]);
    }

    public function deleteDocument(string $collection, string $documentId)
    {
        return $this->firestore->collection($collection)->document($documentId)->delete();
    }
}